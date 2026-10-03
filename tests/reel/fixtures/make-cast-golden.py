"""Freeze the approved mockup sprites as golden data for the JS port.

Needs the local, gitignored mockups in .superpowers/pixel-mock/. Run from the repo root:
    python3 tests/reel/fixtures/make-cast-golden.py tests/reel/fixtures/cast-golden.json
"""
import json, sys
sys.path.insert(0, '.superpowers/pixel-mock')
import art_wear, art_dog


def used(frames, pal):
    chars = sorted({ch for f in frames for row in f for ch in row if ch != '.'})
    return {ch: pal[ch] for ch in chars}


hero = {}
for key in art_wear.OUTFITS:
    frames, pal = art_wear.get(key)
    hero[key] = {'frames': frames, 'palette': used(frames, pal)}
dog = {}
for key, name in [('pup', 'pup_a'), ('bandana', 'dog_a_bandana'), ('msu_knit', 'dog_a_msu_knit'),
                  ('bare', 'dog_a_bare'), ('houndstooth', 'dog_a_houndstooth'), ('hikepack', 'dog_a_hikepack'),
                  ('blaze', 'dog_a_blaze'), ('lifevest', 'dog_a_lifevest')]:
    frames, pal = art_dog.get(name)
    dog[key] = {'frames': frames, 'palette': used(frames, pal)}
out = sys.argv[1]
with open(out, 'w') as fh:
    json.dump({'hero': hero, 'dog': dog}, fh, ensure_ascii=False, indent=0)
print(out, len(hero), 'outfits,', len(dog), 'dog sprites')
