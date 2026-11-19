"""Cut the single ElevenLabs read into its script lines and place each at its film timecode -> vo.wav (80 s, 48 kHz mono)."""
import subprocess, numpy as np
from scipy.io import wavfile
SR = 48000; DUR = 80.0
raw = subprocess.run(['ffmpeg','-loglevel','error','-i','vo.mp3','-f','f32le','-ac','1','-ar',str(SR),'-'],capture_output=True,check=True).stdout
src = np.frombuffer(raw, dtype=np.float32).astype(np.float64)
# (source start, source end, film time at which source start lands); source times from analyze_audio --vo
CLIPS = [(0.00, 6.42, 6.95),    # Tuesday, nine o'clock ... You checked it twice.
         (6.62, 11.80, 18.77 + 6.62 - 6.62 + 0.0),  # placeholder, fixed below
         ]
CLIPS = [  # (src_a, src_b, dest of src_a)
 (0.00, 6.42, 7.00 - 0.05),
 (6.62, 11.80, 25.50 - (6.73 - 6.62)),
 (12.02, 13.25, 39.20 - (12.12 - 12.02)),
 (13.30, 16.32, 42.40 - (13.40 - 13.30)),
 (16.50, 21.98, 48.30 - (16.60 - 16.50)),
 (22.17, 25.20, 56.40 - (22.27 - 22.17)),
 (25.37, 30.27, 64.50 - (25.47 - 25.37)),
]
out = np.zeros(int(DUR * SR))
for a, b, d in CLIPS:
    seg = src[int(a * SR):int(b * SR)].copy(); f = int(0.03 * SR)
    seg[:f] *= np.linspace(0, 1, f); seg[-f:] *= np.linspace(1, 0, f)
    i = int(round(d * SR)); out[i:i + len(seg)] += seg
    print(f'src {a:5.2f}-{b:5.2f} -> film {d:6.2f}-{d + b - a:6.2f}')
wavfile.write('vo.wav', SR, (out * 32767).clip(-32767, 32767).astype(np.int16))
