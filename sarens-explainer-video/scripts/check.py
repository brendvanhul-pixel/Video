"""Final QC of <projectDir>/video.mp4 against the spec. Exit code 1 on a hard failure.
Usage: python3 check.py <projectDir>
Writes build/contact.png (one frame every few seconds) to look at."""
import json, os, re, subprocess, sys
import numpy as np
proj = sys.argv[1]; v = os.path.join(proj, 'video.mp4')
cues = json.load(open(os.path.join(proj, 'cues.json'))); DUR = float(cues['duration'])
def run(a): return subprocess.run(a, capture_output=True, text=True)
p = json.loads(run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', v]).stdout)
vs = [s for s in p['streams'] if s['codec_type'] == 'video'][0]; aus = [s for s in p['streams'] if s['codec_type'] == 'audio']
fails, warns = [], []
dur = float(p['format']['duration']); nf = int(vs.get('nb_frames', 0))
if abs(dur - DUR) > 0.02: fails.append(f'duration {dur:.3f}s, expected {DUR:.3f}s')
if nf != round(DUR * 30): fails.append(f'{nf} frames, expected {round(DUR * 30)}')
if (vs['width'], vs['height']) != (1920, 1080): fails.append(f"resolution {vs['width']}x{vs['height']}")
if vs['r_frame_rate'] != '30/1': fails.append('fps ' + vs['r_frame_rate'])
if not aus: fails.append('no audio stream')
else:
    a = aus[0]
    if a['sample_rate'] != '48000' or a['channels'] != 2: fails.append('audio not 48 kHz stereo')
e = run(['ffmpeg', '-hide_banner', '-i', v, '-af', 'ebur128=peak=true', '-f', 'null', '-']).stderr
I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', e)[-1]); TP = float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', e)[-1])
if abs(I + 14) > 0.5: fails.append(f'loudness {I} LUFS, expected -14 +/- 0.5')
if TP > -1.0: fails.append(f'true peak {TP} dBTP, must be <= -1')
bd = run(['ffmpeg', '-hide_banner', '-i', v, '-vf', 'blackdetect=d=0.03:pix_th=0.06', '-an', '-f', 'null', '-']).stderr
nb = len(re.findall('black_start', bd))
if nb: fails.append(f'{nb} black span(s)')
fz = run(['ffmpeg', '-hide_banner', '-i', v, '-vf', 'freezedetect=n=0.0005:d=3.5', '-an', '-f', 'null', '-']).stderr
for s_, d_ in zip(re.findall(r'freeze_start: ([\d.]+)', fz), re.findall(r'freeze_duration: ([\d.]+)', fz)):
    if float(s_) + float(d_) < DUR - 0.1: warns.append(f'dead span: no motion {float(s_):.1f}s for {float(d_):.1f}s (add micro-motion or cut sooner)')
# yellow budget: share of frame within reach of #FFE300, sampled 4x a second at 192x108
r2 = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', v, '-vf', 'fps=4,scale=192:108', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
frames = np.frombuffer(r2, dtype=np.uint8).reshape(-1, 108, 192, 3).astype(int)
yel = (np.abs(frames[..., 0] - 255) < 40) & (np.abs(frames[..., 1] - 227) < 40) & (frames[..., 2] < 90)
share = yel.mean((1, 2)); over = np.where(share > 0.10)[0]
# full-frame wipes pass through yellow for a few frames; warn only if it lasts > 0.5 s
if len(over):
    runs, start = [], over[0]
    for i, j in zip(over, list(over[1:]) + [None]):
        if j is None or j != i + 1: runs.append((start, i)); start = j
    for s_, e_ in runs:
        if (e_ - s_ + 1) / 4 > 0.5: warns.append(f'yellow covers >10% of the frame {s_ / 4:.1f}-{(e_ + 1) / 4:.1f}s (design system: about a tenth at most)')
step = max(2.0, DUR / 24)
run(['ffmpeg', '-loglevel', 'error', '-y', '-i', v, '-vf', f'fps=1/{step},scale=480:-1,tile=6x4:padding=4:color=white', '-frames:v', '1', os.path.join(proj, 'build', 'contact.png')])
print(f'duration {dur:.3f}s | {nf} frames | {vs["width"]}x{vs["height"]} @ {vs["r_frame_rate"]} | {I} LUFS | TP {TP} dBTP | black spans {nb}')
for w in warns: print('WARN', w)
for f in fails: print('FAIL', f)
print('contact sheet:', os.path.join(proj, 'build', 'contact.png'))
sys.exit(1 if fails else 0)
