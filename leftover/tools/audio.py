"""Soundtrack for a project: music (supplied file or synthesised bed) + sound design from build/sfx.json + optional VO.
Usage: python3 audio.py <projectDir>   -> <projectDir>/build/mix.wav (48 kHz stereo, pre-master)

cues.json keys used:
  duration, bpm
  music: {"file": "music.mp3"}                      -> use the supplied track (trimmed, faded, ducked under VO)
     or  {"sections": [[0,"intro"],[4,"groove"],...], "end": 112.0}   -> synthesised future-bass/pop bed
  vo:    {"file": "vo.wav", "offset": 0.5}           -> placed at offset, music ducks under it
Deterministic: all noise is seeded.
"""
import json, os, subprocess, sys
import numpy as np
from scipy.signal import butter, sosfilt, sosfilt_zi
from scipy.io import wavfile

SR = 48000
proj = sys.argv[1]
cues = json.load(open(os.path.join(proj, 'cues.json')))
sfxcues = json.load(open(os.path.join(proj, 'build', 'sfx.json')))['sfx']
DUR = float(cues['duration']); N = int(round(DUR * SR))
BPM = float(cues.get('bpm', 120)); BEAT = 60 / BPM; BAR = 4 * BEAT
rng = np.random.default_rng(1234)

def decode(path):
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', path, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)
def midi(m): return 440 * 2 ** ((m - 69) / 12)
def tt(n): return np.arange(n) / SR
def add(buf, t0, sig, gain=1.0, pan=0.0):
    i0 = int(round(t0 * SR))
    if sig.ndim == 1:
        sig = np.stack([sig * np.sqrt(0.5 * (1 - pan)), sig * np.sqrt(0.5 * (1 + pan))], 1)
    if i0 < 0: sig = sig[-i0:]; i0 = 0
    n = min(len(sig), len(buf) - i0)
    if n > 0: buf[i0:i0 + n] += sig[:n] * gain
def lp(x, fc): return sosfilt(butter(2, min(fc, SR * 0.45) / (SR / 2), 'low', output='sos'), x)
def hp(x, fc): return sosfilt(butter(2, fc / (SR / 2), 'high', output='sos'), x)
def bp(x, lo, hi): return sosfilt(butter(2, [lo / (SR / 2), min(hi, SR * 0.45) / (SR / 2)], 'band', output='sos'), x)
def saw(f, n, ph=0.0): return 2 * ((ph + np.cumsum(np.full(n, f)) / SR) % 1.0) - 1

# ---------------- sound design palette ----------------
def s_pop(pitch=500, dur=0.08):
    n = int(dur * SR); t = tt(n); f = pitch + pitch * 1.3 * (1 - np.exp(-t / 0.012))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (dur / 3.5))
def s_boing(pitch=200, dur=0.45):
    n = int(dur * SR); t = tt(n); fr = pitch * (1 + 0.5 * np.exp(-t / 0.05)) * (1 + 0.12 * np.sin(2 * np.pi * 16 * t) * np.exp(-t / 0.18))
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t / 0.15)
def s_whoosh(dur=0.4, rise=True, lo=300, hi=4000):
    n = max(int(dur * SR), 64); t = tt(n); x = rng.standard_normal(n); out = np.zeros(n)
    blk = int(0.004 * SR); zi = None
    for i in range(0, n, blk):
        fc = lo * (hi / lo) ** (i / n)
        sos = butter(2, [fc * 0.6 / (SR / 2), min(fc * 1.6, SR * 0.45) / (SR / 2)], 'band', output='sos')
        if zi is None: zi = sosfilt_zi(sos) * 0
        out[i:i + blk], zi = sosfilt(sos, x[i:i + blk], zi=zi)
    e = (t / dur) ** 1.6 * np.clip((dur - t) / 0.03, 0, 1) if rise else np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2
    return lp(out, 8000) * e
def s_tick(pitch=2200):
    n = int(0.035 * SR); t = tt(n); return np.sin(2 * np.pi * pitch * t) * np.exp(-t / 0.008)
def s_ding(fs=(1318.5, 1975.5), dur=0.8, k=1.0):
    fs = tuple(f * k for f in fs)
    n = int(dur * SR); t = tt(n); return sum(np.sin(2 * np.pi * f * t) * np.exp(-t / (0.25 / (i + 1))) for i, f in enumerate(fs)) * 0.5
def s_thunk():
    n = int(0.4 * SR); t = tt(n)
    tw = np.sin(2 * np.pi * 300 * t) * np.exp(-t / 0.2) * (0.6 + 0.4 * np.sin(2 * np.pi * 4.5 * t)) * 0.5
    return np.sin(2 * np.pi * np.cumsum(70 + 80 * np.exp(-t / 0.02)) / SR) * np.exp(-t / 0.08) + bp(rng.standard_normal(n), 200, 2000) * np.exp(-t / 0.02) * 0.6 + tw
def s_zip(dur=0.25):
    n = int(dur * SR); t = tt(n); f = 800 + 2200 * (t / dur) ** 1.5
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.4 + bp(rng.standard_normal(n), 2000, 7000) * 0.3) * np.sin(np.pi * t / dur)
def s_rumble(dur=1.0):
    n = int(dur * SR); t = tt(n); return lp(rng.standard_normal(n), 220) * np.sin(np.pi * t / dur) * 1.6
def s_pluck(note=72, dur=0.22, bright=4000):
    n = int(dur * SR); t = tt(n)
    return lp(saw(midi(note), n) * 0.5 + np.sin(2 * np.pi * midi(note) * t) * 0.5, bright) * np.exp(-t / 0.09)
def s_sparkle():
    out = np.zeros(int(0.7 * SR))
    for i, f in enumerate((2093, 2637, 3136, 4186)):
        n = int(0.4 * SR); t = tt(n); s = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.08) * 0.4
        i0 = int(i * 0.05 * SR); out[i0:i0 + n] += s[:len(out) - i0]
    return out
def s_impact():
    n = int(1.2 * SR); t = tt(n)
    return np.sin(2 * np.pi * np.cumsum(40 + 120 * np.exp(-t / 0.04)) / SR) * np.exp(-t / 0.35) + hp(rng.standard_normal(n), 3000) * np.exp(-t / 0.4) * 0.3

def render_sfx(c):
    k = c['type']; p = c.get('pitch')
    if k == 'pop': return s_pop(p or 500, c.get('dur', 0.08)), 0.45
    if k == 'boing': return s_boing(p or 220, c.get('dur', 0.45)), 0.55
    if k == 'whoosh': return s_whoosh(c.get('dur', 0.4), c.get('rise', True), c.get('lo', 300), c.get('hi', 4000)), 0.4
    if k == 'tick': return s_tick(p or 2200), 0.18
    if k == 'ding': return s_ding(k=(p or 1318.5) / 1318.5), 0.35
    if k == 'thunk': return s_thunk(), 0.75
    if k == 'zip': return s_zip(c.get('dur', 0.25)), 0.4
    if k == 'rumble': return s_rumble(c.get('dur', 1.0)), 0.3
    if k == 'pluck': return s_pluck(c.get('note', 72), 0.15, 6000), 0.22
    if k == 'sparkle': return s_sparkle(), 0.3
    if k == 'impact': return s_impact(), 0.7
    raise ValueError('unknown sfx type ' + k)

# ---------------- synthesised music bed ----------------
CH = {'F': ([53, 57, 60, 64, 69], 41), 'G': ([55, 59, 62, 67, 71], 43), 'Em': ([52, 55, 59, 64, 67], 40), 'Am': ([57, 60, 64, 67, 72], 45)}
PROG = ['G', 'Em', 'Am', 'F']
def synth_music(spec):
    secs = sorted(spec.get('sections', [[0, 'groove']]))
    end_t = spec.get('end', DUR - 2.0)
    def section(t):
        if t >= end_t: return 'end'
        k = secs[0][1]
        for s, kind in secs:
            if t >= s: k = kind
        return k
    def sec_start(t):
        st = 0
        for s, _ in secs:
            if t >= s: st = s
        return st
    def next_start(t):
        for s, _ in secs:
            if s > t: return s
        return end_t
    mus = np.zeros((N, 2)); pad = np.zeros(N)
    nb = int(np.ceil(DUR / BAR))
    for b in range(nb):
        t0 = b * BAR; sec = section(t0)
        if sec == 'end': continue
        notes, _ = CH[PROG[b % 4]]
        n = int(BAR * SR) + int(0.25 * SR); sig = np.zeros(n)
        for m in notes:
            for d in (-0.13, -0.06, 0, 0.06, 0.13): sig += saw(midi(m) * 2 ** (d / 12), n, rng.random()) * 0.06
        e = np.minimum(1, tt(n) / 0.04) * np.clip((BAR + 0.2 - tt(n)) / 0.2, 0, 1)
        lvl = {'intro': 0.5, 'groove': 0.55, 'build': 0.7, 'drop': 1.0, 'break': 0.55}.get(sec, 0.55)
        i0 = int(t0 * SR); m_ = min(n, N - i0)
        if m_ > 0: pad[i0:i0 + m_] += (sig * e * lvl)[:m_]
    # final chord at the end hit
    if end_t < DUR:
        n = N - int(end_t * SR); sig = np.zeros(n)
        for m in [48, 55, 60, 64, 67, 74]:
            for d in (-0.12, -0.05, 0, 0.05, 0.12): sig += saw(midi(m) * 2 ** (d / 12), n, rng.random()) * 0.06
        pad[int(end_t * SR):] += sig * np.exp(-tt(n) / 0.9) * np.clip((n / SR - tt(n)) / 0.5, 0, 1) * 1.1
    def cutoff(t):
        s = section(t)
        if s == 'intro': return 1000
        if s == 'groove': return 1800
        if s == 'build': u = (t - sec_start(t)) / max(0.1, next_start(t) - sec_start(t)); return 1800 + 6000 * u * u
        if s == 'drop': return 7000
        if s == 'break': return 700
        return 5000 * np.exp(-(t - end_t) * 1.2) + 600
    sos = butter(2, 1000 / (SR / 2), 'low', output='sos'); zi = sosfilt_zi(sos) * 0
    blk = int(0.01 * SR); padf = np.zeros(N)
    for i in range(0, N, blk):
        sos = butter(2, cutoff(i / SR) / (SR / 2), 'low', output='sos')
        padf[i:i + blk], zi = sosfilt(sos, pad[i:i + blk], zi=zi)
    kicks = []
    for b in range(nb):
        t0 = b * BAR; s = section(t0)
        if s == 'groove': kicks += [t0, t0 + 1.5 * BEAT, t0 + 2 * BEAT]
        if s == 'build': kicks += [t0]
        if s == 'drop': kicks += [t0 + k * BEAT for k in range(4)]
    kicks = [k for k in kicks if k < end_t] + ([end_t] if end_t < DUR else [])
    side = np.ones(N)
    for k in kicks:
        i0 = int(k * SR); m_ = min(int(0.35 * SR), N - i0)
        if m_ > 0: side[i0:i0 + m_] = np.minimum(side[i0:i0 + m_], 1 - 0.65 * np.exp(-tt(m_) / 0.09))
    padf *= side
    d = int(0.011 * SR)
    mus[:, 0] += padf * 0.8; mus[d:, 1] += padf[:-d] * 0.8
    def kick():
        n = int(0.45 * SR); t = tt(n); f = 45 + 110 * np.exp(-t / 0.035)
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16) + 0.4 * hp(rng.standard_normal(n), 3000) * np.exp(-t / 0.004)
    def clap():
        n = int(0.3 * SR); t = tt(n); nz = bp(rng.standard_normal(n), 900, 5000)
        e = sum(np.exp(-np.maximum(0, t - dd) / 0.008) * (t >= dd) for dd in (0, 0.011, 0.022)) * 0.6 + np.exp(-t / 0.09) * (t >= 0.03)
        return nz * e * 0.6
    def hat(op=False):
        n = int((0.25 if op else 0.06) * SR); t = tt(n); return hp(rng.standard_normal(n), 7000) * np.exp(-t / (0.08 if op else 0.015)) * 0.35
    def snare():
        n = int(0.2 * SR); t = tt(n); return bp(rng.standard_normal(n), 1200, 8000) * np.exp(-t / 0.05) * 0.6 + np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.04) * 0.4
    def crash():
        n = int(2.0 * SR); t = tt(n); return hp(rng.standard_normal(n), 4000) * np.exp(-t / 0.6) * 0.35
    for k in kicks: add(mus, k, kick(), 0.95)
    for b in range(nb):
        t0 = b * BAR; s = section(t0); notes, root = CH[PROG[b % 4]]
        if t0 >= end_t: break
        if s in ('groove', 'drop'):
            for k in (1, 3): add(mus, t0 + k * BEAT, clap(), 0.55, 0.05)
        if s == 'groove':
            for k in range(4): add(mus, t0 + (k + 0.5) * BEAT, hat(), 0.5, 0.3)
        if s == 'drop':
            for k in range(16): add(mus, t0 + k * BEAT / 4, hat(k % 4 == 2), 0.45 if k % 2 else 0.25, 0.3 if k % 2 else -0.3)
            for pos in (0, 0.75, 1.5, 2.5, 3.0, 3.5):
                for m in notes[1:]: add(mus, t0 + pos * BEAT, s_pluck(m + 12, 0.18, 6000), 0.12)
        if s in ('intro', 'groove', 'build'):
            seq = [notes[i % 5] + 12 for i in (0, 2, 4, 3, 1, 3, 4, 2)]
            for k in range(8): add(mus, t0 + k * BEAT / 2, s_pluck(seq[k], 0.22, 2500 if s == 'intro' else 4000), 0.28, -0.35 if k % 2 else 0.35)
        if s in ('groove', 'drop', 'build'):
            n = int(BAR * SR); t = tt(n)
            sub = np.sin(2 * np.pi * midi(root) * t) * 0.5 + 0.12 * np.sin(2 * np.pi * midi(root + 12) * t)
            e = np.minimum(1, t / 0.01) * np.clip((BAR - t) / 0.03, 0, 1)
            i0 = int(t0 * SR); g = side[i0:i0 + n]
            add(mus, t0, sub[:len(g)] * e[:len(g)] * g * (0.9 if s == 'drop' else 0.6))
    # builds: snare roll + riser, a quarter beat of air, crash on the next section
    for s0, kind in secs:
        if kind != 'build': continue
        s1 = next_start(s0); L = s1 - s0
        for i in range(int(L / (BEAT / 2))):
            tt0 = s0 + i * BEAT / 2
            sub_div = 1 if tt0 < s0 + L * 0.5 else 2 if tt0 < s0 + L * 0.75 else 4
            for j in range(sub_div): add(mus, tt0 + j * BEAT / 2 / sub_div, snare(), 0.22 + 0.25 * (tt0 - s0) / L, 0.1)
        n = int((L - 0.25) * SR); t = tt(n)
        add(mus, s0, bp(rng.standard_normal(n), 400, 9000) * (t / (L - 0.25)) ** 2 * 0.25)
        a, b_ = int((s1 - 0.25) * SR), int(s1 * SR)
        mus[a:b_] *= np.linspace(1, 0.15, b_ - a)[:, None]
        add(mus, s1, crash(), 1.0)
    if end_t < DUR:
        add(mus, end_t, crash(), 1.0)
        n = N - int(end_t * SR); t = tt(n); add(mus, end_t, np.sin(2 * np.pi * midi(36) * t) * np.exp(-t / 0.8) * 0.6)
    return mus

# ---------------- assemble ----------------
music_spec = cues.get('music', {})
if music_spec.get('file'):
    mus = decode(os.path.join(proj, music_spec['file']))[:N]
    if len(mus) < N: mus = np.concatenate([mus, np.zeros((N - len(mus), 2))])
    mus = mus / (np.sqrt(np.mean(mus ** 2)) + 1e-9) * 0.12      # rough level match to the synth bed
    f = int(min(2.0, DUR / 10) * SR); mus[-f:] *= np.linspace(1, 0, f)[:, None]
    music_gain = 1.0
else:
    mus = synth_music(music_spec); music_gain = 0.55

mg = np.ones(N)
for a, b in music_spec.get('mute', []):
    ia, ib = int(a * SR), int(b * SR); r = int(0.04 * SR); ro = int(0.4 * SR)
    mg[ia:ib] = 0
    if ia > 0: mg[max(0, ia - r):ia] = np.minimum(mg[max(0, ia - r):ia], np.linspace(1, 0, ia - max(0, ia - r)))
    if ib < N: n_ = min(ro, N - ib); mg[ib:ib + n_] = np.minimum(mg[ib:ib + n_], np.linspace(0, 1, n_))
mus = mus * mg[:, None]
sfx = np.zeros((N, 2))
for c in sfxcues:
    sig, g = render_sfx(c)
    gain = c['gain'] if c.get('gain') is not None else g
    add(sfx, c['t'], sig, gain, c.get('pan') or 0)

vo = np.zeros((N, 2)); duck = np.ones(N)
if cues.get('vo', {}).get('file'):
    v = decode(os.path.join(proj, cues['vo']['file']))
    v = v / (np.sqrt(np.mean(v[np.abs(v).max(1) > 0.01] ** 2)) + 1e-9) * 0.18
    if cues['vo'].get('clips'):
        for c in cues['vo']['clips']:
            seg = v[int(c['from'] * SR):int(c['to'] * SR)].copy(); f = int(0.012 * SR)
            seg[:f] *= np.linspace(0, 1, f)[:, None]; seg[-f:] *= np.linspace(1, 0, f)[:, None]
            add(vo, float(c['at']), seg)
    else:
        add(vo, float(cues['vo'].get('offset', 0.0)), v)
    env = np.abs(vo).max(1); w = int(0.05 * SR)
    env = np.convolve(env, np.ones(w) / w, mode='same'); env = np.clip(env / (env.max() + 1e-9) * 4, 0, 1)
    rel = np.exp(-1 / (0.3 * SR)); sm = np.empty_like(env); cur = 0.0
    for i in range(N):
        cur = env[i] if env[i] > cur else env[i] + (cur - env[i]) * rel; sm[i] = cur
    duck = 1 - 0.65 * sm                                       # about -9 dB under speech

mix = mus * music_gain * duck[:, None] + sfx * 0.75 * (1 - 0.3 * (1 - duck))[:, None] + vo * 1.0
# look-ahead peak limiter so loudnorm can run in linear mode
from numpy.lib.stride_tricks import sliding_window_view
peak = np.max(np.abs(mix), 1); w = int(0.003 * SR)
pk = sliding_window_view(np.pad(peak, (0, w - 1), mode='edge'), w).max(1)
target = np.percentile(peak[peak > 1e-4], 99.5) * 0.7 if np.any(peak > 1e-4) else 1
g = np.minimum(1, target / np.maximum(pk, 1e-9))
rel = np.exp(-1 / (0.08 * SR)); gs = np.empty_like(g); cur = 1.0
for i in range(N):
    cur = g[i] if g[i] < cur else g[i] + (cur - g[i]) * rel; gs[i] = cur
mix *= gs[:, None]
f = int(0.03 * SR); mix[-f:] *= np.linspace(1, 0, f)[:, None]
mix /= np.max(np.abs(mix)) / 0.89
wavfile.write(os.path.join(proj, 'build', 'mix.wav'), SR, (mix * 32767).astype(np.int16))
print(f'mix.wav {DUR:.2f}s  music={"file" if music_spec.get("file") else "synth"}  vo={"yes" if cues.get("vo", {}).get("file") else "no"}  sfx cues={len(sfxcues)}')
