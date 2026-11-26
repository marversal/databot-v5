"""Source sheets (databot_poses_sheet, dog_run_sheet, drone_sheet, cube .png) are not committed; put them in tools/art4k/ to re-run.
Slices the supplied 4K art sheets into clean transparent PNGs (no downscale, no re-pixelation)."""
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
SRC = 'tools/art4k/'; OUT = 'assets/sprites/'

def clean(path):
    """Soft-threshold the haze alpha and replace edge colours with the nearest solid interior colour (kills white fringe)."""
    a = np.array(Image.open(path).convert('RGBA')).astype(np.float32)
    al = a[:, :, 3]
    core = al >= 235
    out_a = np.clip((al - 60) / (235 - 60), 0, 1) * 255
    out_a[al < 60] = 0
    idx = ndi.distance_transform_edt(~core, return_distances=False, return_indices=True)
    rgb = a[:, :, :3][idx[0], idx[1]]
    rgb[core] = a[:, :, :3][core]
    res = np.dstack([rgb, out_a]).astype(np.uint8)
    res[res[:, :, 3] == 0, :3] = 0
    return Image.fromarray(res, 'RGBA')

def parts(im, min_area=4000, grow=9):
    m = np.array(im)[:, :, 3] > 128
    lab, n = ndi.label(ndi.binary_dilation(m, structure=np.ones((grow, grow))))
    boxes = []
    for i, sl in enumerate(ndi.find_objects(lab), 1):
        if (lab[sl] == i).sum() < min_area: continue
        boxes.append((sl[1].start, sl[0].start, sl[1].stop, sl[0].stop))
    return boxes

def crop_tight(im, box, pad=3):
    c = im.crop(box); a = np.array(c)[:, :, 3] > 20; ys, xs = np.where(a)
    c = c.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    out = Image.new('RGBA', (c.width + 2 * pad, c.height + 2 * pad), (0, 0, 0, 0)); out.paste(c, (pad, pad)); return out

def unify(frames):
    W = max(f.width for f in frames); H = max(f.height for f in frames); res = []
    for f in frames:
        c = Image.new('RGBA', (W, H), (0, 0, 0, 0)); c.paste(f, ((W - f.width) // 2, H - f.height)); res.append(c)
    return res

def save(im, name): im.save(OUT + name + '.png', optimize=True); print(name, im.size)

import os
def section_run():
    poses = clean(SRC + 'databot_poses_sheet.png'); b = parts(poses); assert len(b) == 6, b
    row1 = sorted([x for x in b if (x[1] + x[3]) / 2 < poses.height / 2], key=lambda x: x[0]); row2 = sorted([x for x in b if x not in row1], key=lambda x: x[0])
    names = ['run', 'carry', 'jump']
    for i, f in enumerate(unify([crop_tight(poses, bx) for bx in row1 + row2])): save(f, 'databot_%s_%s' % (names[i % 3], 'L' if i < 3 else 'R'))

def section_dog():
    dog = clean(SRC + 'dog_run_sheet.png'); b = sorted(parts(dog), key=lambda x: x[0]); assert len(b) == 4, b
    for i, f in enumerate(unify([crop_tight(dog, bx) for bx in b])): save(f, 'dog_run%d' % (i + 1))

def section_drone():
    dr = clean(SRC + 'drone_sheet.png'); b = parts(dr); assert len(b) == 4, b
    top = sorted([x for x in b if (x[1] + x[3]) / 2 < dr.height / 2], key=lambda x: x[0]); bot = sorted([x for x in b if x not in top], key=lambda x: x[0])
    for n, f in zip(['fly1', 'fly2', 'shoot', 'tilt'], unify([crop_tight(dr, bx) for bx in top + bot])): save(f, 'drone_' + n)

def section_cube():
    cube = clean(SRC + 'cube.png'); save(crop_tight(cube, (0, 0, cube.width, cube.height)), 'cube')

def section_poses_v2():
    # TL jump launch (faces left), TR airborne (art reads as travelling right, so it is stored as native R after the facing fix), BL grab reach (left), BR grab lift (left); mirrored for the other facing.
    im = clean(SRC + 'databot_poses_v2.png'); b = parts(im); assert len(b) == 4, b
    top = sorted([x for x in b if (x[1] + x[3]) / 2 < im.height / 2], key=lambda x: x[0]); bot = sorted([x for x in b if x not in top], key=lambda x: x[0])
    frames = unify([crop_tight(im, bx) for bx in top + bot])
    for (name, native), f in zip([('launch', 'L'), ('air', 'L'), ('reach', 'L'), ('lift', 'L')], frames):
        m = f.transpose(Image.FLIP_LEFT_RIGHT); other = 'R' if native == 'L' else 'L'
        save(f, 'databot_%s_%s' % (name, native)); save(m, 'databot_%s_%s' % (name, other))

for fname, fn in [('databot_poses_sheet.png', section_run), ('dog_run_sheet.png', section_dog), ('drone_sheet.png', section_drone), ('cube.png', section_cube), ('databot_poses_v2.png', section_poses_v2)]:
    if os.path.exists(SRC + fname): fn()
