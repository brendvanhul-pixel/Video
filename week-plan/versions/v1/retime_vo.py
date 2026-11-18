"""Place the recorded VO sentence by sentence on the picture and re-time captions + early cues.
Inputs: cues.json (script-timed), vo_units.json (sentence -> [start,end] in vo.wav), vo.wav.
Outputs: cues.json (updated), vo_placed.wav (120 s, 48 kHz mono)."""
import json, subprocess, numpy as np
from scipy.io import wavfile
c = json.load(open('cues.json')); units = json.load(open('vo_units.json'))
# piecewise-linear warp for scenes 1-3 (old script time -> new time), identity after 31.3 s
A = [(0, 0), (2.2, 2.8), (4.4, 5.1), (7.0, 8.0), (9.0, 9.6), (10.0, 11.5), (11.2, 13.47), (15.6, 17.97), (22.25, 23.25), (23.2, 24.0), (31.3, 31.3)]
def warp(t):
    if t >= 31.3: return t
    for (a0, b0), (a1, b1) in zip(A, A[1:]):
        if a0 <= t <= a1: return b0 + (t - a0) * (b1 - b0) / (a1 - a0)
    return t
c['t'] = {k: round(warp(v), 3) for k, v in c['t'].items()}
plan = [warp(x[0]) for x in c['captions']] + [c['t']['title1']]
place = []; prev = -1
for k, (a, b, txt) in enumerate(units):
    s = a if k < 5 else max(plan[k], prev + 0.3)   # first five lines keep the read's own timing
    place.append([s, s + (b - a), a, b, txt]); prev = s + (b - a)
# end card: words pop as they are spoken, dot lands after "Wednesday"
last = place[-1]; L2 = last[0] + (103.61 - 102.05)
c['t']['title1'] = round(last[0] - 0.05, 3); c['t']['title2'] = round(L2 - 0.05, 3)
c['t']['finalHop'] = round(last[1] - 0.25, 3); c['t']['finalLand'] = round(last[1] + 0.25, 3)
c['music']['end'] = c['t']['finalLand']
# captions: show with the voice, rest long enough to read, never overlap the next
caps = []
starts = [p[0] - 0.1 for p in place[:-1]]
for k, p in enumerate(place[:-1]):
    t0 = starts[k]; nxt = starts[k + 1] - 0.05 if k + 1 < len(starts) else 120
    rt = max(2.0, 0.4 * len(p[4].split()) + 1.0)
    t1 = min(nxt, max(p[1] + 0.4, t0 + rt))
    caps.append([round(t0, 2), round(t1, 2), p[4]])
c['captions'] = caps
c['vo'] = {'file': 'vo_placed.wav', 'offset': 0.0, 'source': 'vo.wav', 'placement': [[round(p[0], 3), p[2], p[3]] for p in place]}
json.dump(c, open('cues.json', 'w'), indent=1, ensure_ascii=False)
SR = 48000
raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', 'vo.wav', '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
x = np.frombuffer(raw, dtype=np.float32).astype(np.float64)
out = np.zeros(int(c['duration'] * SR)); pre, post, f = 0.08, 0.15, int(0.02 * SR)
for s, e, a, b, _ in place:
    i0, i1 = int((a - pre) * SR), min(len(x), int((b + post) * SR)); seg = x[max(0, i0):i1].copy()
    seg[:f] *= np.linspace(0, 1, f); seg[-f:] *= np.linspace(1, 0, f)
    o = int((s - pre) * SR); n = min(len(seg), len(out) - o); out[o:o + n] += seg[:n]
wavfile.write('vo_placed.wav', SR, (out * 32767).astype(np.int16))
for p in place: print(f"{p[0]:7.2f}-{p[1]:7.2f}  {p[4][:60]}")
print('final land', c['t']['finalLand'])
