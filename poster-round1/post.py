import sys
from PIL import Image
for n in sys.argv[1:]:
    im = Image.open(f'out/{n}.png').convert('RGB')
    W,H = im.size; b = round(W*3/303)
    t = im.crop((b,b,W-b,H-b)); t.save(f'out/{n}-trim.png')
    t.resize((round(t.width*.15), round(t.height*.15)), Image.LANCZOS).save(f'out/{n}-15.png')
