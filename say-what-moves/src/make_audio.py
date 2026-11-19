"""Builds the two audio stems the film reads from cues.json:
  vo.wav     the single ElevenLabs read, cut at its pauses and re-placed on the script's timecodes
  music.wav  dry pizzicato score + room tone + piano note + message chimes, with the script's silences
Usage: python3 src/make_audio.py <projectDir>
Deterministic (seeded noise). Line placements live in cues.json -> vo_lines.
"""
import json, os, subprocess, sys
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

SR = 48000
P = sys.argv[1]
cues = json.load(open(os.path.join(P, 'cues.json')))
DUR = cues['duration']; N = int(DUR * SR)
rng = np.random.default_rng(7)

def decode(path):
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).astype(np.float64)
def tt(n): return np.arange(n) / SR
def midi(m): return 440 * 2 ** ((m - 69) / 12)
def add(buf, t0, sig, g=1.0):
    i0 = int(round(t0 * SR)); n = min(len(sig), len(buf) - i0)
    if n > 0: buf[i0:i0 + n] += sig[:n] * g
def lp(x, fc): return sosfilt(butter(2, fc / (SR / 2), 'low', output='sos'), x)
def hp(x, fc): return sosfilt(butter(2, fc / (SR / 2), 'high', output='sos'), x)

# ---------------- VO: cut and re-place ----------------
src = decode(os.path.join(P, 'src', 'vo_source.mp3'))
vo = np.zeros(N)
for a, b, at in cues['vo_lines']:
    seg = src[int(a * SR):int(b * SR)].copy()
    f = int(0.012 * SR); seg[:f] *= np.linspace(0, 1, f); seg[-f:] *= np.linspace(1, 0, f)
    add(vo, at, seg)
wavfile.write(os.path.join(P, 'vo.wav'), SR, (vo / max(1e-9, np.abs(vo).max()) * 0.9 * 32767).astype(np.int16))

# ---------------- music ----------------
M = cues['score']; BPM = M['bpm']; BEAT = 60 / BPM
mus = np.zeros((N, 2))
def put(t0, sig, g=1.0, pan=0.0):
    s = np.stack([sig * np.sqrt(0.5 * (1 - pan)), sig * np.sqrt(0.5 * (1 + pan))], 1)
    i0 = int(round(t0 * SR)); n = min(len(s), N - i0)
    if n > 0 and i0 >= 0: mus[i0:i0 + n] += s[:n] * g

def pizz(note, dur=0.35, bright=1.0):
    # plucked string: Karplus-Strong, short and dry
    f = midi(note); L = max(2, int(SR / f)); n = int(dur * SR)
    buf = rng.uniform(-1, 1, L) * 0.8; out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % L]
        buf[i % L] = 0.5 * (buf[i % L] + buf[(i + 1) % L]) * (0.994 if bright > 0.8 else 0.985)
    t = tt(n); out *= np.exp(-t / (0.11 * dur / 0.35))
    return lp(out, 5200 * bright)
def piano(note, dur=3.0):
    n = int(dur * SR); t = tt(n); f = midi(note)
    s = sum(np.sin(2 * np.pi * f * k * t) * np.exp(-t * (0.9 + 0.8 * k)) / k ** 1.3 for k in range(1, 7))
    return s * np.minimum(1, t / 0.004) * 0.6
def chime(fs, dur=1.2):
    n = int(dur * SR); t = tt(n)
    return sum(np.sin(2 * np.pi * f * t) * np.exp(-t / (0.5 / (i + 1))) for i, f in enumerate(fs)) * 0.35
def bass(note, dur=0.3):
    n = int(dur * SR); t = tt(n); f = midi(note)
    return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * np.exp(-t / 0.12) * np.minimum(1, t / 0.003)

PROG = {'C': ([60, 64, 67], 36), 'Am': ([57, 60, 64], 33), 'F': ([57, 60, 65], 29), 'G': ([55, 59, 62], 31),
        'Dm': ([57, 62, 65], 38), 'E': ([56, 59, 64], 40), 'Fm': ([56, 60, 65], 29)}
cache = {}
def P_(note, dur=0.35, bright=1.0):
    k = (note, dur, bright)
    if k not in cache: cache[k] = pizz(note, dur, bright)
    return cache[k]

def bed(t0, t1, prog, pattern, gain=1.0, bright=1.0, melody=None):
    """pattern: list of (beat_offset, chord_index or 'b') per bar of 4 beats"""
    bar = 4 * BEAT; nb = int(np.ceil((t1 - t0) / bar - 1e-6))
    for b in range(nb):
        ch, root = PROG[prog[b % len(prog)]]
        for off, what in pattern:
            at = t0 + b * bar + off * BEAT
            if at >= t1: continue
            if what == 'b': put(at, bass(root), 0.55 * gain)
            else: put(at, P_(ch[what] + (12 if bright > 1 else 0), 0.3, min(bright, 1)), 0.32 * gain, pan=[-0.35, 0.1, 0.4][what])
        if melody:
            for off, note in melody[b % len(melody)]:
                at = t0 + b * bar + off * BEAT
                if at < t1: put(at, P_(note, 0.5), 0.26 * gain, pan=0.15)
    return t0 + nb * bar

# room tone: soft filtered noise, gone for the two silent beats before the thud
rt = lp(hp(rng.standard_normal(N), 90), 700) * 0.018
env = np.ones(N); a, b = M['silence']
env[int(a * SR):int(b * SR)] = 0
fi = int(0.04 * SR); env[int(a * SR) - fi:int(a * SR)] = np.linspace(1, 0, fi)
env[int(b * SR):int(b * SR) + int(0.6 * SR)] = np.linspace(0, 1, int(0.6 * SR))
env *= np.clip(1 - (tt(N) - M['roomOut']) / 2.0, 0.35, 1)  # drops under the score once it starts
mus += np.stack([rt * env, rt * env], 1)

put(M['piano'], piano(48, 3.5), 0.9)
groove = [(0, 'b'), (0.5, 0), (1, 1), (1.5, 2), (2, 'b'), (2.5, 1), (3, 0), (3.5, 2)]
mel = [[(0, 72), (1.5, 74)], [(0, 76), (2, 72)], [(0, 77), (1, 76), (2, 74)], [(0, 74), (2.5, 67)]]
bed(M['bed1'][0], M['bed1'][1], ['C', 'Am', 'F', 'G'], groove, 1.0, 1.0, mel)
# tense: two bars, low and staccato
tense = [(0, 'b'), (0.5, 0), (1, 0), (1.5, 0), (2, 'b'), (2.5, 0), (3, 0), (3.5, 0)]
bed(M['tense'][0], M['tense'][1], ['Dm', 'E'], tense, 0.9, 0.6)
# lift: brighter, melody up an octave on the second half
bed(M['lift'][0], M['lift'][1], ['F', 'G', 'C', 'Am'], groove, 0.9, 1.0, None)
bed(M['lift2'][0], M['lift2'][1], ['F', 'G', 'Am', 'C'], groove, 1.05, 1.0, [[(0, 81), (1.5, 79)], [(0, 79), (2, 74)], [(0, 76), (1, 77), (2, 79)], [(0, 84)]])
# button: last chord, plucked together + bass
bt = M['button']
for i, nte in enumerate([48, 60, 64, 67, 72]): put(bt + i * 0.012, P_(nte, 0.9), 0.4)
put(bt, bass(36, 0.6), 0.8)
# message chimes: the second one brighter
put(M['chime1'], chime((880, 1108.7)), 0.8, -0.2)
put(M['chime1b'], chime((880, 1108.7)), 0.7, 0.2)
put(M['chime2'], chime((1318.5, 1760, 2637)), 0.9, -0.2)
put(M['chime2b'], chime((1568, 2093, 3136)), 1.0, 0.2)
f = int(0.02 * SR); mus[-f:] *= np.linspace(1, 0, f)[:, None]
wavfile.write(os.path.join(P, 'music.wav'), SR, (mus / max(1e-9, np.abs(mus).max()) * 0.9 * 32767).astype(np.int16))
print('vo.wav + music.wav written', DUR)
