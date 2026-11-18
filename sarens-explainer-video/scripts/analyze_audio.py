"""Inspect a supplied music or voice-over file before you time the picture to it.
Usage: python3 analyze_audio.py <file> [--vo]
Music: prints duration, estimated BPM and the first downbeat offset -> put bpm in cues.json and snap hits to the grid.
VO (--vo): prints speech segments (start-end) -> map script sentences to them in order; captions and beats hang off these times.
"""
import subprocess, sys, json
import numpy as np
SR = 22050
path = sys.argv[1]; is_vo = '--vo' in sys.argv
raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
x = np.frombuffer(raw, dtype=np.float32).astype(np.float64)
dur = len(x) / SR
hop = 512; fr = np.lib.stride_tricks.sliding_window_view(x, 1024)[::hop]
rms = np.sqrt((fr ** 2).mean(1)); tfr = np.arange(len(rms)) * hop / SR
out = {'file': path, 'duration': round(dur, 3)}
if is_vo:
    thr = min(max(np.percentile(rms, 10) * 4, rms.max() * 0.05), rms.max() * 0.3)
    on = rms > thr; segs = []; i = 0
    while i < len(on):
        if on[i]:
            j = i
            while j < len(on) and (on[j] or (j + 1 < len(on) and np.any(on[j:j + int(0.25 * SR / hop)]))): j += 1
            if tfr[min(j, len(tfr) - 1)] - tfr[i] > 0.2: segs.append([round(tfr[i], 2), round(tfr[min(j, len(tfr) - 1)], 2)])
            i = j
        i += 1
    out['speech_segments'] = segs
else:
    spec = np.abs(np.fft.rfft(fr * np.hanning(1024), axis=1))
    # low-band spectral flux follows kick and bass, which carry the pulse
    flux = np.maximum(0, np.diff(np.log1p(spec[:, :60]), axis=0)).sum(1)
    flux = np.maximum(flux - np.convolve(flux, np.ones(16) / 16, mode='same'), 0)
    fps = SR / hop; best = None
    for bpm in np.arange(70, 180.5, 0.5):                      # comb over tempo x phase, mild prior at 120
        per = 60 / bpm * fps
        sc, ph = max((flux[np.round(np.arange(p, len(flux) - 1, per)).astype(int)].mean(), p) for p in np.arange(0, per, 1.0))
        sc *= np.exp(-0.5 * (np.log2(bpm / 120) / 0.9) ** 2)
        if best is None or sc > best[0]: best = (sc, bpm, ph)
    bpm = float(best[1]); off = best[2] / fps
    out.update({'bpm_estimate': round(float(bpm), 1), 'first_beat': round(float(off), 3),
                'note': 'Check the BPM by ear or against the track metadata; snap hero hits to first_beat + n*60/bpm.'})
print(json.dumps(out, indent=1))
