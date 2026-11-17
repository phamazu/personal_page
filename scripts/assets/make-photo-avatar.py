"""Cắt ảnh chân dung thành ảnh đại diện vuông cho trang.

Ảnh gốc để ở images/branding/avatar-source.jpg. Khung cắt khai báo bằng pixel trên
ảnh gốc, nên muốn chỉnh chỉ cần đổi CROP — không phải cắt tay bằng phần mềm khác.

Chạy: python scripts/assets/make-photo-avatar.py
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
BRANDING = ROOT / "images" / "branding"
SOURCE = BRANDING / "avatar-source.jpg"

# (trái, trên, cạnh) — khung vuông trên ảnh gốc.
# Ảnh gốc 1064×1280: tóc bắt đầu ở y≈215, cằm ở y≈680, mặt rộng x≈390–690.
CROP = (260, 175, 560)

# Kích thước xuất. 512 là đủ cho khung tròn ~100 px kể cả màn hình 3x.
SIZE = 512


def main():
    if not SOURCE.exists():
        raise SystemExit(f"Không thấy ảnh gốc: {SOURCE}")

    left, top, side = CROP
    image = Image.open(SOURCE).convert("RGB")

    if left < 0 or top < 0 or left + side > image.width or top + side > image.height:
        raise SystemExit(
            f"Khung cắt {CROP} vượt ra ngoài ảnh {image.width}×{image.height}"
        )

    square = image.crop((left, top, left + side, top + side))
    avatar = square.resize((SIZE, SIZE), Image.LANCZOS)

    # Làm nét nhẹ sau khi thu nhỏ để mắt và gọng kính không bị mềm.
    avatar = avatar.filter(ImageFilter.UnsharpMask(radius=1.6, percent=52, threshold=3))

    avatar.save(BRANDING / "avatar.png", optimize=True)

    print("Created:", BRANDING / "avatar.png", avatar.size)


if __name__ == "__main__":
    main()
