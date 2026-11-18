"""Music + sound design, locked to cues.json. Deterministic (seeded noise).
Writes mix.wav (48 kHz stereo, pre-master). Mastering to -14 LUFS happens in build.sh via ffmpeg loudnorm."""
import json, numpy as np
from scipy.signal import butter, sosfilt, sosfilt_zi
from scipy.io import wavfile

SR = 48000
cues = json.load(open('cues.json'))
T, DUR, BPM = cues['t'], cues['duration'], cues['bpm']
N = int(DUR * SR)
BEAT = 60 / BPM
rng = np.random.default_rng(1234)
mus = np.zeros((N, 2)); sfx = np.zeros((N, 2))

def midi(m): return 440 * 2 ** ((m - 69) / 12)
def tt(n): return np.arange(n) / SR
def add(buf, t0, sig, gain=1.0, pan=0.0):
    i0 = int(round(t0 * SR))
    if sig.ndim == 1: sig = np.stack([sig * np.sqrt(0.5 * (1 - pan)), sig * np.sqrt(0.5 * (1 + pan))], 1) * np.sqrt(2) * 0.7071
    if i0 < 0: sig = sig[-i0:]; i0 = 0
    n = min(len(sig), N - i0)
    if n > 0: buf[i0:i0 + n] += sig[:n] * gain
def lp(x, fc, order=2): return sosfilt(butter(order, min(fc, SR * 0.45) / (SR / 2), 'low', output='sos'), x)
def hp(x, fc, order=2): return sosfilt(butter(order, fc / (SR / 2), 'high', output='sos'), x)
def bp(x, lo, hi, order=2): return sosfilt(butter(order, [lo / (SR / 2), min(hi, SR * 0.45) / (SR / 2)], 'band', output='sos'), x)
def env_ad(n, a, d):
    t = tt(n); e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / d); return e
def saw(f, n, phase=0.0):
    ph = (phase + np.cumsum(np.full(n, f) if np.isscalar(f) else f) / SR) % 1.0
    return 2 * ph - 1

# ---------------- music ----------------
CH = {  # chord tones (midi) and bass root
    'F': ([53, 57, 60, 64, 69], 41), 'G': ([55, 59, 62, 67, 71], 43),
    'Em': ([52, 55, 59, 64, 67], 40), 'Am': ([57, 60, 64, 67, 72], 45)}
PROG = ['G', 'Em', 'Am', 'F']           # bar 0 = G ... bar 7 (the drop at 14 s) = F
def chord_at(bar): return CH[PROG[bar % 4]]
BAR = 4 * BEAT
nbars = int(DUR / BAR)
def section(t):
    if t < 4: return 'intro'
    if t < 12: return 'groove'
    if t < 14: return 'build'
    if t < 20: return 'drop'
    if t < 22: return 'break'
    return 'end'

# supersaw pad, rendered per bar, then a time-varying low-pass
pad = np.zeros(N)
for b in range(nbars + 1):
    t0 = b * BAR
    if t0 >= DUR: break
    notes, _ = chord_at(b)
    sec = section(t0)
    if sec == 'end': continue
    n = int(BAR * SR) + int(0.25 * SR)
    sig = np.zeros(n)
    for m in notes:
        for d in (-0.13, -0.06, 0, 0.06, 0.13):
            sig += saw(midi(m) * 2 ** (d / 12), n, rng.random()) * 0.06
    e = np.minimum(1, tt(n) / 0.04) * np.clip((BAR + 0.2 - tt(n)) / 0.2, 0, 1)
    lvl = {'intro': 0.5, 'groove': 0.55, 'build': 0.7, 'drop': 1.0, 'break': 0.55}[sec]
    i0 = int(t0 * SR); m_ = min(n, N - i0)
    pad[i0:i0 + m_] += (sig * e * lvl)[:m_]
# final chord (C add9) at the final landing
fin_notes = [48, 55, 60, 64, 67, 74]
n = N - int(T['finalLand'] * SR)
sig = np.zeros(n)
for m in fin_notes:
    for d in (-0.12, -0.05, 0, 0.05, 0.12): sig += saw(midi(m) * 2 ** (d / 12), n, rng.random()) * 0.06
fe = np.exp(-tt(n) / 0.9) * np.clip((n / SR - tt(n)) / 0.5, 0, 1)
pad[int(T['finalLand'] * SR):] += sig * fe * 1.1

def cutoff(t):
    s = section(t)
    if s == 'intro': return 900 + 400 * t / 4
    if s == 'groove': return 1800
    if s == 'build': return 1800 + 6000 * ((t - 12) / 2) ** 2
    if s == 'drop': return 7000
    if s == 'break': return 700
    return 5000 * np.exp(-(t - 22) * 1.2) + 600
sos = butter(2, 1000 / (SR / 2), 'low', output='sos'); zi = sosfilt_zi(sos) * 0
blk = int(0.01 * SR); padf = np.zeros(N)
for i in range(0, N, blk):
    sos = butter(2, cutoff(i / SR) / (SR / 2), 'low', output='sos')
    padf[i:i + blk], zi = sosfilt(sos, pad[i:i + blk], zi=zi)

# kicks / sidechain
kicks = []
for b in range(nbars):
    t0 = b * BAR; s = section(t0)
    if s == 'groove': kicks += [t0, t0 + 1.5 * BEAT, t0 + 2 * BEAT]
    if s == 'build': kicks += [t0, t0 + 2 * BEAT] if t0 + 2 * BEAT < 13.75 else [t0]
    if s == 'drop': kicks += [t0 + k * BEAT for k in range(4)]
kicks += [T['finalLand']]
side = np.ones(N); tN = tt(N)
for k in kicks:
    i0 = int(k * SR); m_ = min(int(0.35 * SR), N - i0)
    side[i0:i0 + m_] = np.minimum(side[i0:i0 + m_], 1 - 0.65 * np.exp(-tt(m_) / 0.09))
padf *= side
# stereo pad: slight Haas widening
padL = padf; padR = np.concatenate([np.zeros(int(0.011 * SR)), padf[:-int(0.011 * SR)]])
mus[:, 0] += padL * 0.8; mus[:, 1] += padR * 0.8

def kick():
    n = int(0.45 * SR); t = tt(n)
    f = 45 + 110 * np.exp(-t / 0.035)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16) + 0.4 * hp(rng.standard_normal(n), 3000) * np.exp(-t / 0.004)
def clap():
    n = int(0.3 * SR); t = tt(n); nz = bp(rng.standard_normal(n), 900, 5000)
    e = sum(np.exp(-np.maximum(0, t - d) / 0.008) * (t >= d) for d in (0, 0.011, 0.022)) * 0.6 + np.exp(-t / 0.09) * (t >= 0.03)
    return nz * e * 0.6
def hat(open_=False):
    n = int((0.25 if open_ else 0.06) * SR); t = tt(n)
    return hp(rng.standard_normal(n), 7000) * np.exp(-t / (0.08 if open_ else 0.015)) * 0.35
def snare():
    n = int(0.2 * SR); t = tt(n)
    return (bp(rng.standard_normal(n), 1200, 8000) * np.exp(-t / 0.05) * 0.6 + np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.04) * 0.4)
def crash():
    n = int(2.0 * SR); t = tt(n)
    return hp(rng.standard_normal(n), 4000) * np.exp(-t / 0.6) * 0.35
for k in kicks: add(mus, k, kick(), 0.95)
for b in range(nbars):
    t0 = b * BAR; s = section(t0)
    if s in ('groove', 'drop') or (s == 'intro' and b == 1):
        for k in (1, 3): add(mus, t0 + k * BEAT, clap(), 0.55 if s != 'intro' else 0.3, 0.05)
    if s == 'groove':
        for k in range(4): add(mus, t0 + (k + 0.5) * BEAT, hat(), 0.5, 0.3)
    if s == 'drop':
        for k in range(16): add(mus, t0 + k * BEAT / 4, hat(k % 4 == 2), 0.45 if k % 2 else 0.25, 0.3 if k % 2 else -0.3)
# build snare roll + riser, then a beat of silence before the drop
roll = [12 + i * BEAT / 2 for i in range(4)] + [13 + i * BEAT / 4 for i in range(4)] + [13.5 + i * BEAT / 8 for i in range(4)]
for i, r in enumerate(roll): add(mus, r, snare(), 0.25 + 0.035 * i, 0.1)
n = int(1.75 * SR); t = tt(n)
ris = bp(rng.standard_normal(n), 400, 9000) * (t / 1.75) ** 2 * 0.25
add(mus, 12.0, ris)
mus[int(13.75 * SR):int(14.0 * SR)] *= np.linspace(1, 0.15, int(0.25 * SR))[:, None]
add(mus, 14.0, crash(), 1.0); add(mus, T['finalLand'], crash(), 1.0)
n = int(1.0 * SR); add(mus, 21.0, bp(rng.standard_normal(n), 400, 8000) * (tt(n) / 1.0) ** 2 * 0.2)

# sub bass
for b in range(nbars):
    t0 = b * BAR; s = section(t0)
    if s not in ('groove', 'drop', 'build'): continue
    _, root = chord_at(b)
    n = int(BAR * SR); t = tt(n)
    sub = np.sin(2 * np.pi * midi(root) * t) * 0.5 + 0.12 * np.sin(2 * np.pi * midi(root + 12) * t)
    e = np.minimum(1, t / 0.01) * np.clip((BAR - t) / 0.03, 0, 1)
    i0 = int(t0 * SR); g = side[i0:i0 + n]
    add(mus, t0, sub * e * g[:len(sub)] * (0.9 if s == 'drop' else 0.6))
n = N - int(T['finalLand'] * SR); t = tt(n)
add(mus, T['finalLand'], np.sin(2 * np.pi * midi(36) * t) * np.exp(-t / 0.8) * 0.6)

# pluck arp (intro, groove) and drop stabs
def pluck(m, dur=0.22, bright=4000):
    n = int(dur * SR); t = tt(n)
    s_ = saw(midi(m), n) * 0.5 + np.sin(2 * np.pi * midi(m) * t) * 0.5
    return lp(s_, bright) * np.exp(-t / 0.09)
for b in range(nbars):
    t0 = b * BAR; s = section(t0)
    notes, _ = chord_at(b)
    if s in ('intro', 'groove', 'build'):
        seq = [notes[i % 5] + 12 for i in (0, 2, 4, 3, 1, 3, 4, 2)]
        for k in range(8):
            add(mus, t0 + k * BEAT / 2, pluck(seq[k], bright=2500 if s == 'intro' else 4000), 0.28, -0.35 if k % 2 else 0.35)
    if s == 'drop':
        for pos in (0, 0.75, 1.5, 2.5, 3.0, 3.5):
            for m in notes[1:]: add(mus, t0 + pos * BEAT, pluck(m + 12, 0.18, 6000), 0.12)

# ---------------- sound design ----------------
def pop(f0=500, f1=1200, dur=0.08):
    n = int(dur * SR); t = tt(n); f = f0 + (f1 - f0) * (1 - np.exp(-t / 0.012))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (dur / 3.5))
def boing(f=200, dur=0.45):
    n = int(dur * SR); t = tt(n); fr = f * (1 + 0.5 * np.exp(-t / 0.05)) * (1 + 0.12 * np.sin(2 * np.pi * 16 * t) * np.exp(-t / 0.18))
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t / 0.15)
def whoosh(dur, rise=True, lo=300, hi=4000):
    n = int(dur * SR); t = tt(n); x = rng.standard_normal(n); out = np.zeros(n)
    blk = int(0.004 * SR); zi = None
    for i in range(0, n, blk):
        u = i / n; u = u if rise else 1 - u
        fc = lo * (hi / lo) ** u
        sos = butter(2, [fc * 0.6 / (SR / 2), min(fc * 1.6, SR * 0.45) / (SR / 2)], 'band', output='sos')
        if zi is None: zi = sosfilt_zi(sos) * 0
        out[i:i + blk], zi = sosfilt(sos, x[i:i + blk], zi=zi)
    e = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2 if not rise else (t / dur) ** 1.6 * np.clip((dur - t) / 0.03, 0, 1)
    return lp(out, 8000) * e
def tick(f=2200):
    n = int(0.035 * SR); t = tt(n); return np.sin(2 * np.pi * f * t) * np.exp(-t / 0.008)
def ding(fs=(1318.5, 1975.5), dur=0.8):
    n = int(dur * SR); t = tt(n); return sum(np.sin(2 * np.pi * f * t) * np.exp(-t / (0.25 / (i + 1))) for i, f in enumerate(fs)) * 0.5
def thunk():
    n = int(0.4 * SR); t = tt(n)
    tw = np.sin(2 * np.pi * 300 * t) * np.exp(-t / 0.2) * (0.6 + 0.4 * np.sin(2 * np.pi * 4.5 * t)) * 0.5
    return np.sin(2 * np.pi * np.cumsum(70 + 80 * np.exp(-t / 0.02)) / SR) * np.exp(-t / 0.08) + bp(rng.standard_normal(n), 200, 2000) * np.exp(-t / 0.02) * 0.6 + tw
def zip_(dur=0.25):
    n = int(dur * SR); t = tt(n); f = 800 + 2200 * (t / dur) ** 1.5
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.4 + bp(rng.standard_normal(n), 2000, 7000) * 0.3) * np.sin(np.pi * t / dur)
def rumble(dur):
    n = int(dur * SR); t = tt(n); return lp(rng.standard_normal(n), 220) * np.sin(np.pi * t / dur) * 1.6

PENTA = [72, 74, 76, 79, 81, 84, 86, 88, 91, 93, 96, 98]
F = 1 / 30
cue_sfx = [
    (T['drop'], whoosh(0.5, True, 200, 2500), 0.45, 0),
    (T['land1'], boing(150), 0.8, 0), (T['land1'], pop(120, 60, 0.12), 0.6, 0),
    (T['land2'], pop(300, 500, 0.06), 0.35, 0),
    (T['leap'] - 0.02, whoosh(0.35, False, 500, 3500), 0.35, 0.3),
    (T['dotLand'], pop(700, 1500), 0.55, 0.35),
    (T['s1exit'], whoosh(0.4, False, 600, 5000), 0.35, 0),
    (T['lineLand'], pop(260, 520, 0.09), 0.55, -0.6),
    (T['rollStart'], rumble(T['flagDec'] - T['rollStart']), 0.35, 0),
    (T['flagJun'], pop(500, 900), 0.45, 0), (T['flagDec'], pop(600, 1100), 0.5, 0.6),
    (T['iris'] - 0.1, whoosh(0.6, True, 150, 5000), 0.6, 0.3),
    (T['charA'], boing(260, 0.35), 0.45, -0.25), (T['charB'], boing(320, 0.35), 0.45, 0.25),
    (T['bubA1'], pop(600, 1300), 0.45, -0.4), (T['bubB1'], pop(700, 1400), 0.45, 0.4),
    (T['bubA2'], pop(600, 1300), 0.45, -0.4), (T['bubB2'], pop(700, 1400), 0.45, 0.4),
    (T['wipeAnt'], whoosh(T['badge1'] - 0.5 - T['wipeAnt'] + 0.05, True, 150, 6000), 0.55, 0),
    (T['badge1'], pop(300, 700, 0.1), 0.6, -0.5), (T['badge2'], pop(350, 800, 0.1), 0.6, 0), (T['badge3'], pop(400, 900, 0.1), 0.6, 0.5),
    (T['check'], zip_(), 0.45, 0),
    (T['arrow'], whoosh(T['hit'] - T['arrow'], True, 600, 7000), 0.5, -0.3),
    (T['hit'], thunk(), 0.75, 0.5),
    (T['heart'], pop(800, 1600), 0.4, 0), (T['coin'], ding(), 0.35, -0.5),
    (T['collapse'], whoosh(0.5, True, 3000, 300), 0.45, 0),
    (T['heroPop'], pop(400, 900, 0.1), 0.55, 0),
    (T['blueWipe'], whoosh(0.42, True, 200, 4000), 0.4, 0),
    (T['hop'], whoosh(0.32, True, 600, 5000), 0.35, 0),
    (T['finalLand'], boing(330, 0.5), 0.6, 0.3), (T['finalLand'], ding((1568, 2349.3, 3136), 1.6), 0.3, 0.3),
]
for i in range(5): cue_sfx.append((T['words1'] + i * 2 * F, pop(900 + 120 * i, 1700 + 150 * i, 0.05), 0.22, -0.3 + 0.15 * i))
for i in range(12): cue_sfx.append((T['months'] + i * 2 * F, pluck(PENTA[i], 0.15, 6000), 0.22, -0.7 + i * 0.13))
for i in range(3): cue_sfx.append((T['bars'] + i * 3 * F, pop(500 + 200 * i, 1000 + 300 * i, 0.06), 0.3, -0.5))
for k in ('label1', 'label2', 'label3', 'cap2a', 'cap2b', 'cap3', 'kicker', 'title', 'tagline'): cue_sfx.append((T[k], tick(), 0.18, 0))
for t0, s, g, pan in cue_sfx: add(sfx, t0, s, g, pan)

mix = mus * 0.55 + sfx * 0.75
# gentle look-ahead limiter so loudnorm can stay in linear mode
peak = np.max(np.abs(mix), 1)
w = int(0.003 * SR)
from numpy.lib.stride_tricks import sliding_window_view
pk = np.concatenate([sliding_window_view(np.pad(peak, (0, w - 1), mode='edge'), w).max(1)])
ceil = 0.5
g = np.minimum(1, ceil / np.maximum(pk, 1e-9))
# smooth gain: instant attack (already look-ahead), 80 ms release
rel = np.exp(-1 / (0.08 * SR)); gs = np.empty_like(g); cur = 1.0
for i in range(N):
    cur = g[i] if g[i] < cur else g[i] + (cur - g[i]) * rel
    gs[i] = cur
mix = mix * gs[:, None]
mix[-int(0.03 * SR):] *= np.linspace(1, 0, int(0.03 * SR))[:, None]
mix /= np.max(np.abs(mix)) / 0.89
wavfile.write('mix.wav', SR, (mix * 32767).astype(np.int16))
print('wrote mix.wav', N / SR, 's')
