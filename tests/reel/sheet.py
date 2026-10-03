"""Compose frames from frames.mjs into an enlarged contact sheet (dev review tool).

    python3 tests/reel/sheet.py <frames-dir> <out.png> [scale]
"""
import sys, glob, os
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]
scale = int(sys.argv[3]) if len(sys.argv) > 3 else 2
files = sorted(glob.glob(os.path.join(d, 't*.png')), key=lambda f: float(os.path.basename(f)[1:-4]))
ims = [Image.open(f).convert('RGB') for f in files]
w = max(i.width for i in ims) * scale; h = ims[0].height * scale
sheet = Image.new('RGB', (w, (h + 18) * len(ims)), (20, 20, 24))
dr = ImageDraw.Draw(sheet)
for n, (f, im) in enumerate(zip(files, ims)):
    sheet.paste(im.resize((im.width * scale, im.height * scale), Image.NEAREST), (0, n * (h + 18) + 18))
    dr.text((4, n * (h + 18) + 3), os.path.basename(f)[1:-4] + 's', fill=(217, 163, 91))
sheet.save(out); print(out, sheet.size)
