#!/usr/bin/env python3
"""
Deterministic reconstruction of Pokémon Platinum title/boot BG frames.

Ground truth only: reads the decomp's decoded tile sheets (res/graphics/
title_screen/*.png) and the real NSCR tilemaps, and composes the exact
256x192 on-screen frame by placing each mapped 8x8 tile (index + H/V flip)
and applying the BG scroll offset taken from src/applications/title_screen.c.

Nothing here is hand-drawn, cropped by eye, or approximated. Output frames
are meant to be pixel-diffed against the emulator heap-dump capture until the
difference is zero.

Usage: python3 tools/reconstruct_title.py <pokeplatinum_repo> <out_dir>
"""
import struct, sys, os
from PIL import Image

DS_W, DS_H = 256, 192


def parse_nscr(path):
    d = open(path, "rb").read()
    assert d[:4] == b"RCSN", "not an NSCR: %s" % path
    sec = d[16:]
    assert sec[:4] == b"NRCS"
    w, h = struct.unpack("<HH", sec[8:12])
    datasize = struct.unpack("<I", sec[16:20])[0]
    ents = struct.unpack("<%dH" % (datasize // 2), sec[20:20 + datasize])
    return w, h, ents


def compose(sheet_png, nscr_path):
    """Return the full BG image described by the NSCR, tiles taken from the
    nitrogfx raster-tile-ordered sheet PNG."""
    w, h, ents = parse_nscr(nscr_path)
    sheet = Image.open(sheet_png).convert("RGBA")
    tpr = sheet.width // 8
    cols = w // 8
    bg = Image.new("RGBA", (w, h), (0, 0, 0, 255))
    for i, e in enumerate(ents):
        tile = e & 0x3FF
        hf = (e >> 10) & 1
        vf = (e >> 11) & 1
        sx, sy = (tile % tpr) * 8, (tile // tpr) * 8
        t = sheet.crop((sx, sy, sx + 8, sy + 8))
        if hf:
            t = t.transpose(Image.FLIP_LEFT_RIGHT)
        if vf:
            t = t.transpose(Image.FLIP_TOP_BOTTOM)
        bg.paste(t, ((i % cols) * 8, (i // cols) * 8))
    return bg


def visible(bg, scroll_x=0, scroll_y=0):
    """Crop the 256x192 the DS actually displays, honouring the BG scroll
    (BGs wrap, so use modulo)."""
    out = Image.new("RGBA", (DS_W, DS_H), (0, 0, 0, 255))
    for y in range(DS_H):
        for x in range(DS_W):
            out.putpixel((x, y), bg.getpixel(((x + scroll_x) % bg.width,
                                              (y + scroll_y) % bg.height)))
    return out


# Frame -> (tile-sheet png, NSCR, scroll_x, scroll_y). Scroll offsets are the
# Bg_SetOffset values from src/applications/title_screen.c.
FRAMES = {
    # Title bottom (sub) screen: Pokémon Platinum logo. LOGO BG offset X=0,Y=1.
    "logo":       ("logo.png",        "logo.NSCR",        0, 1),
    # Opening: "Developed by GAME FREAK inc." BG.
    "gf_presents": ("gf_presents.png", "gf_presents.NSCR", 0, 0),
    # Copyright line BG (title top screen, BG1).
    "copyright":  ("copyright.png",   "copyright.NSCR",   0, 0),
}


def main():
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)
    repo, out = sys.argv[1], sys.argv[2]
    gdir = os.path.join(repo, "res", "graphics", "title_screen")
    os.makedirs(out, exist_ok=True)
    for name, (png, nscr, sx, sy) in FRAMES.items():
        bg = compose(os.path.join(gdir, png), os.path.join(gdir, nscr))
        frame = visible(bg, sx, sy)
        frame.save(os.path.join(out, name + ".png"))
        print("wrote %s  (BG %dx%d, scroll %d,%d)" % (name, bg.width, bg.height, sx, sy))


if __name__ == "__main__":
    main()
