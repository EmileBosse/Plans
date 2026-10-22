"""Génère les icônes de la PWA Plans dans icons/ (PNG + SVG).

Une plaque blanche percée de 4 trous, avec sa cote, sur fond bleu.

    python tools/generer-icones.py
"""
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'icons'
BLUE, WHITE = (37, 99, 235), (255, 255, 255)
SS = 4  # suréchantillonnage pour des bords lisses


def shapes(k):
    """Éléments du dessin sur une grille de 512, réduits de k autour du centre (zone sûre « maskable »)."""
    t = lambda v: 256 + (v - 256) * k
    return {
        'plate': (t(96), t(160), t(416), t(372), 22 * k),
        'holes': [(t(x), t(y), 23 * k) for x in (152, 360) for y in (216, 316)],
        'slot': (t(206), t(246), t(306), t(286), 20 * k, 11 * k),
        'dim': (t(96), t(110), t(416), 9 * k, 22 * k),
    }


def png(size, k=1.0, radius=0):
    s = size * SS / 512
    img = Image.new('RGBA', (size * SS, size * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((0, 0, size * SS - 1, size * SS - 1), radius=radius * s, fill=BLUE)
    g = shapes(k)
    l, t, r, b, rr = g['plate']
    d.rounded_rectangle((l * s, t * s, r * s, b * s), radius=rr * s, fill=WHITE)
    for x, y, hr in g['holes']:
        d.ellipse(((x - hr) * s, (y - hr) * s, (x + hr) * s, (y + hr) * s), fill=BLUE)
    l, t, r, b, rr, w = g['slot']
    d.rounded_rectangle((l * s, t * s, r * s, b * s), radius=rr * s, outline=BLUE, width=round(w * s))
    x1, y, x2, w, tick = g['dim']
    d.line((x1 * s, y * s, x2 * s, y * s), fill=WHITE, width=round(w * s))
    for x in (x1, x2):
        d.line((x * s, (y - tick) * s, x * s, (y + tick) * s), fill=WHITE, width=round(w * s))
    return img.resize((size, size), Image.LANCZOS)


def svg():
    g = shapes(1)
    l, t, r, b, rr = g['plate']
    holes = ''.join(f'<circle cx="{x:g}" cy="{y:g}" r="{hr:g}" fill="#2563eb"/>' for x, y, hr in g['holes'])
    sl, st, sr, sb, srr, sw = g['slot']
    x1, y, x2, w, tick = g['dim']
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">'
        '<rect width="512" height="512" rx="112" fill="#2563eb"/>'
        f'<rect x="{l:g}" y="{t:g}" width="{r - l:g}" height="{b - t:g}" rx="{rr:g}" fill="#fff"/>{holes}'
        f'<rect x="{sl:g}" y="{st:g}" width="{sr - sl:g}" height="{sb - st:g}" rx="{srr:g}" fill="none" stroke="#2563eb" stroke-width="{sw:g}"/>'
        f'<path d="M{x1:g} {y:g}H{x2:g}M{x1:g} {y - tick:g}V{y + tick:g}M{x2:g} {y - tick:g}V{y + tick:g}" '
        f'stroke="#fff" stroke-width="{w:g}" stroke-linecap="round"/></svg>\n'
    )


def main():
    OUT.mkdir(exist_ok=True)
    png(192, radius=112).save(OUT / 'icon-192.png')
    png(512, radius=112).save(OUT / 'icon-512.png')
    png(512, k=.78).save(OUT / 'maskable-512.png')
    # iOS arrondit lui-même les coins et veut une image opaque
    png(180).convert('RGB').save(OUT / 'apple-touch-icon.png')
    (OUT / 'icon.svg').write_text(svg(), encoding='utf-8')
    print('icônes générées dans', OUT)


if __name__ == '__main__':
    main()
