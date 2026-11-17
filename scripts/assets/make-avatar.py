"""Sinh ảnh đại diện và favicon cho trang.

Ảnh đại diện: nền tối chuyển sắc, vài cánh hoa ở rìa, chữ lồng "P" serif
tô gradient trắng-hồng, một vòng tròn mảnh.

Chạy: python scripts/assets/make-avatar.py
"""
from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[2]
BRANDING = ROOT / "images" / "branding"

SIZE = 512
SUPERSAMPLE = 2
S = SIZE * SUPERSAMPLE

FONT_CANDIDATES = [
    r"C:\Windows\Fonts\georgia.ttf",
    r"C:\Windows\Fonts\pala.ttf",
    r"C:\Windows\Fonts\times.ttf",
]

PINK = (255, 157, 187)
GLOW = (255, 122, 165)
TOP = (40, 27, 50)
BOTTOM = (11, 8, 17)


def mix(a, b, t):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(len(a)))


def radial_canvas(size, inner, outer, center, radius):
    image = Image.new("RGB", (size, size), outer)
    pixels = image.load()
    cx, cy = center
    for y in range(size):
        for x in range(size):
            distance = math.hypot(x - cx, y - cy) / radius
            pixels[x, y] = mix(inner, outer, min(1.0, distance) ** 1.05)
    return image


def load_font(px):
    for candidate in FONT_CANDIDATES:
        path = Path(candidate)
        if path.exists():
            return ImageFont.truetype(str(path), px)
    return ImageFont.load_default()


def bezier(p0, p1, p2, p3, steps):
    points = []
    for i in range(steps + 1):
        t = i / steps
        u = 1 - t
        x = u**3 * p0[0] + 3 * u**2 * t * p1[0] + 3 * u * t**2 * p2[0] + t**3 * p3[0]
        y = u**3 * p0[1] + 3 * u**2 * t * p1[1] + 3 * u * t**2 * p2[1] + t**3 * p3[1]
        points.append((x, y))
    return points


def petal_points(cx, cy, r, angle):
    """Cùng dáng cánh hoa với bản Canvas 2D: vẽ bằng hai nhánh bezier, có khía đầu."""
    # Toạ độ đơn vị: cuống ở (0, 1), khía ở (0, -0.74), hai vai ở (±0.16, -1).
    outline = [(0.0, 1.0)]
    outline += bezier((0.0, 1.0), (0.86, 0.52), (0.80, -0.72), (0.16, -1.0), 26)
    outline += [(0.0, -0.74)]
    outline += bezier((-0.16, -1.0), (-0.80, -0.72), (-0.86, 0.52), (0.0, 1.0), 26)

    ca, sa = math.cos(angle), math.sin(angle)
    return [
        (cx + (x * r) * ca - (y * r) * sa, cy + (x * r) * sa + (y * r) * ca)
        for x, y in outline
    ]


def add_petals(image, seed=11):
    layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    random.seed(seed)

    # Chỉ vài cánh nhỏ ở rìa: đủ gợi, không lấn chữ.
    spots = [
        (0.90, 0.115, 0.062, 2.40, 96),
        (0.86, 0.185, 0.040, 0.80, 74),
        (0.085, 0.875, 0.050, 5.20, 84),
        (0.14, 0.945, 0.034, 3.60, 62),
        (0.78, 0.915, 0.030, 1.10, 58),
    ]

    for fx, fy, fr, angle, alpha in spots:
        draw.polygon(
            petal_points(S * fx, S * fy, S * fr, angle), fill=(255, 205, 224, alpha)
        )

    layer = layer.filter(ImageFilter.GaussianBlur(S * 0.003))
    return Image.alpha_composite(image, layer)


def gradient_glyph(text, font, top_color, bottom_color):
    """Chữ tô gradient dọc, có mask mềm để mép chữ không bị răng cưa."""
    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).text((S / 2, S / 2), text, font=font, fill=255, anchor="mm")
    mask = mask.filter(ImageFilter.GaussianBlur(S * 0.0016))

    ramp = Image.new("RGB", (1, S))
    for y in range(S):
        ramp.putpixel((0, y), mix(top_color, bottom_color, y / (S - 1)))
    ramp = ramp.resize((S, S), Image.BILINEAR)

    glyph = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    glyph.paste(ramp, (0, 0), mask)
    return glyph, mask


def build_avatar():
    image = radial_canvas(
        S, TOP, BOTTOM, (S * 0.5, S * 0.36), S * 1.15
    ).convert("RGBA")

    # Quầng hồng phía trên, đủ rộng để không thành vệt.
    glow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse(
        [S * 0.10, -S * 0.28, S * 0.90, S * 0.52], fill=GLOW + (74,)
    )
    glow = glow.filter(ImageFilter.GaussianBlur(S * 0.16))
    image = Image.alpha_composite(image, glow)

    image = add_petals(image)

    font = load_font(int(S * 0.50))
    glyph, mask = gradient_glyph("P", font, (255, 249, 252), (255, 168, 196))

    # Quầng sáng sau chữ.
    halo = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    halo.paste(Image.new("RGBA", (S, S), (255, 190, 214, 155)), (0, 0), mask)
    halo = halo.filter(ImageFilter.GaussianBlur(S * 0.045))
    image = Image.alpha_composite(image, halo)
    image = Image.alpha_composite(image, glyph)

    # Hai vòng tròn mảnh.
    for inset, alpha, width in ((0.075, 34, 0.0022), (0.115, 16, 0.0016)):
        ring = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        ImageDraw.Draw(ring).ellipse(
            [S * inset, S * inset, S * (1 - inset), S * (1 - inset)],
            outline=(255, 214, 226, alpha),
            width=max(1, int(S * width)),
        )
        image = Image.alpha_composite(image, ring)

    # Nhiễu rất nhẹ chống banding.
    noise = Image.effect_noise((S, S), 5).convert("L").point(lambda v: int(v * 0.05))
    noise_rgba = Image.merge("RGBA", (noise, noise, noise, Image.new("L", (S, S), 30)))
    image = Image.alpha_composite(image, noise_rgba)

    return image.resize((SIZE, SIZE), Image.LANCZOS).convert("RGB")


def main():
    BRANDING.mkdir(parents=True, exist_ok=True)

    avatar = build_avatar()
    avatar.save(BRANDING / "avatar.png", optimize=True)
    avatar.resize((64, 64), Image.LANCZOS).save(BRANDING / "favicon.png", optimize=True)

    print("Created:", BRANDING / "avatar.png")
    print("Created:", BRANDING / "favicon.png")


if __name__ == "__main__":
    main()
