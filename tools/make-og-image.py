#!/usr/bin/env python3
"""Generate the share image, the favicon set and site.webmanifest.

Everything this script draws (name, initials, tagline) is read from
js/content.js, so after filling in the TBD placeholders there you only have to
re-run:

    python3 tools/make-og-image.py

Outputs (all overwritten in place):

    images/og-image.png         1200x630  Open Graph / Twitter card image
    images/apple-touch-icon.png  180x180  iOS home-screen icon
    images/icon-192.png          192x192  web manifest icon
    images/icon-512.png          512x512  web manifest icon (maskable-safe)
    images/favicon.svg                    initials mark, scalable
    site.webmanifest                      name/short_name from content.js

Requirements: python3 + Pillow, and a DejaVu (or other listed) system font.
No network access and no build step.
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:  # pragma: no cover - environment problem, fail loudly
    sys.exit("error: Pillow is required.  Install it with:  pip install Pillow")

# --- Configuration ---------------------------------------------------------
# The canonical origin of the site.  Change it here if the site ever moves;
# index.html's meta tags use the same value.
SITE_URL = "https://aegisssc.github.io"

ROOT = Path(__file__).resolve().parent.parent
CONTENT_JS = ROOT / "js" / "content.js"
IMAGES = ROOT / "images"
MANIFEST = ROOT / "site.webmanifest"

# Nord palette, mirroring css/themes/midpoint.css (dark theme).
BG = "#161720"        # --bg      / midpoint dusk
SURFACE = "#242630"   # --surface / midpoint
TEXT = "#EDEEF2"      # --text    / midpoint
TEXT_DIM = "#B8BAC7"  # --text-dim/ midpoint
ACCENT = "#FF9A52"    # --accent  / midpoint tangerine
GLOW_2 = "#7ABAEB"    # --accent-2, the second background glow on the page

# Font candidates, in order of preference.  The script fails loudly rather
# than silently falling back to Pillow's tiny bitmap default.
FONT_CANDIDATES = {
    "bold": [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/Library/Fonts/Arial Bold.ttf",
    ],
    "regular": [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/TTF/DejaVuSans.ttf",
        "/usr/share/fonts/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/Library/Fonts/Arial.ttf",
    ],
    "mono": [
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
        "/usr/share/fonts/TTF/DejaVuSansMono.ttf",
        "/usr/share/fonts/dejavu/DejaVuSansMono.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf",
        "/Library/Fonts/Courier New.ttf",
    ],
}


# --- Content ---------------------------------------------------------------
def read_site_content() -> dict:
    """Read name / initials / tagline out of js/content.js.

    Uses node when it is on PATH (authoritative: it evaluates the file), and
    falls back to a small regex parse so the script also works without node.
    """
    if not CONTENT_JS.is_file():
        sys.exit(f"error: cannot find {CONTENT_JS}")

    keys = ("name", "initials", "tagline")
    script = (
        "global.window = {};"
        f"require({str(CONTENT_JS)!r});"
        "const s = global.window.SITE || {};"
        "process.stdout.write(JSON.stringify("
        "{name: s.name, initials: s.initials, tagline: s.tagline}));"
    )
    try:
        out = subprocess.run(
            ["node", "-e", script],
            capture_output=True, text=True, timeout=30, check=True,
        ).stdout
        data = json.loads(out)
        if all(isinstance(data.get(k), str) and data[k] for k in keys):
            return data
        sys.exit("error: js/content.js does not define SITE.name/initials/tagline")
    except (OSError, subprocess.SubprocessError, ValueError):
        pass  # node missing or unhappy - fall back to the regex parse

    source = CONTENT_JS.read_text(encoding="utf-8")
    data = {}
    for key in keys:
        m = re.search(rf"^\s*{key}\s*:\s*(['\"])(.*?)\1", source, re.M)
        if not m:
            sys.exit(
                f"error: could not find SITE.{key} in {CONTENT_JS}.\n"
                "       Install node, or keep the key on its own line as "
                f"`{key}: '...'`."
            )
        data[key] = m.group(2)
    return data


# --- Small drawing helpers -------------------------------------------------
def load_font(kind: str, size: int) -> ImageFont.FreeTypeFont:
    for path in FONT_CANDIDATES[kind]:
        if os.path.isfile(path):
            return ImageFont.truetype(path, size)
    sys.exit(
        f"error: no '{kind}' font found.  Looked for:\n  "
        + "\n  ".join(FONT_CANDIDATES[kind])
        + "\nInstall the DejaVu fonts (Debian/Ubuntu: apt install fonts-dejavu-core)\n"
        "or add your font's path to FONT_CANDIDATES in tools/make-og-image.py."
    )


def text_size(draw: ImageDraw.ImageDraw, text: str, font) -> tuple[int, int]:
    left, top, right, bottom = draw.textbbox((0, 0), text, font=font)
    return right - left, bottom - top


def fit_font(draw, text: str, kind: str, max_width: int, start: int, minimum: int):
    """Largest font size (<= start) at which `text` fits in `max_width`."""
    size = start
    while size > minimum:
        font = load_font(kind, size)
        if text_size(draw, text, font)[0] <= max_width:
            return font
        size -= 2
    return load_font(kind, minimum)


def wrap(draw, text: str, font, max_width: int, max_lines: int) -> list[str]:
    words, lines, current = text.split(), [], ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if current and text_size(draw, candidate, font)[0] > max_width:
            lines.append(current)
            current = word
            if len(lines) == max_lines:
                break
        else:
            current = candidate
    if len(lines) < max_lines and current:
        lines.append(current)
    if len(lines) == max_lines and current and lines[-1] != current:
        # Ran out of lines: mark the truncation instead of dropping words.
        lines[-1] = lines[-1].rstrip(" ,;.") + "..."
    return lines or [""]


def radial_glow(size: tuple[int, int], center: tuple[float, float],
                radius: float, color: str, strength: float) -> Image.Image:
    """A soft circular glow, composited over the background.

    Built at low resolution and upscaled, which is both fast and smooth.
    """
    w, h = size
    small_w, small_h = 96, max(1, round(96 * h / w))
    mask = Image.new("L", (small_w, small_h))
    px = mask.load()
    cx, cy = center[0] * small_w, center[1] * small_h
    r = radius * small_w
    for y in range(small_h):
        for x in range(small_w):
            d = ((x - cx) ** 2 + ((y - cy) * small_w / small_h) ** 2) ** 0.5
            t = max(0.0, 1.0 - d / r)
            px[x, y] = int(255 * strength * t * t)
    mask = mask.resize((w, h), Image.BICUBIC)
    return Image.new("RGB", (w, h), color), mask


def rounded_badge(size: int, initials: str, *, radius_ratio: float = 0.22,
                  padding: float = 0.0, bg: str = SURFACE,
                  outline: str = ACCENT, fg: str = ACCENT,
                  backdrop: str | None = None) -> Image.Image:
    """The initials mark: a rounded square with the initials centered in it.

    Drawn at 4x and downsampled so the corners and the type stay smooth.
    `padding` insets the badge inside the canvas (used for the maskable icon).
    """
    ss = 4
    canvas = size * ss
    img = Image.new("RGB", (canvas, canvas), backdrop or bg)
    draw = ImageDraw.Draw(img)

    inset = round(canvas * padding)
    box = (inset, inset, canvas - inset - 1, canvas - inset - 1)
    side = box[2] - box[0]
    stroke = max(ss, round(side * 0.035))
    draw.rounded_rectangle(box, radius=round(side * radius_ratio), fill=bg,
                           outline=outline, width=stroke)

    font = load_font("bold", max(8, round(side * 0.44)))
    left, top, right, bottom = draw.textbbox((0, 0), initials, font=font)
    while right - left > side * 0.68 and font.size > 8:
        font = load_font("bold", font.size - 2)
        left, top, right, bottom = draw.textbbox((0, 0), initials, font=font)
    cx = box[0] + side / 2 - (left + right) / 2
    cy = box[1] + side / 2 - (top + bottom) / 2
    draw.text((cx, cy), initials, font=font, fill=fg)

    return img.resize((size, size), Image.LANCZOS)


# --- Outputs ---------------------------------------------------------------
def make_og_image(site: dict) -> Path:
    W, H = 1200, 630
    margin = 84

    img = Image.new("RGB", (W, H), BG)
    for center, radius, color, strength in (
        ((0.86, 0.14), 0.55, ACCENT, 0.16),
        ((0.12, 0.96), 0.60, GLOW_2, 0.12),
    ):
        layer, mask = radial_glow((W, H), center, radius, color, strength)
        img = Image.composite(layer, img, mask)

    draw = ImageDraw.Draw(img)

    # Accent hairline down the left edge of the content column.
    draw.rectangle((margin, margin, margin + 5, H - margin), fill=ACCENT)
    content_x = margin + 5 + 46
    content_w = W - content_x - margin

    # Initials badge.
    badge_size = 132
    badge = rounded_badge(badge_size, site["initials"], backdrop=BG)
    img.paste(badge, (content_x, margin + 8))

    # Name.
    name_font = fit_font(draw, site["name"], "bold", content_w, 92, 44)
    name_y = margin + 8 + badge_size + 54
    draw.text((content_x, name_y), site["name"], font=name_font, fill=TEXT)
    name_h = text_size(draw, site["name"], name_font)[1]

    # Tagline, wrapped to at most two lines.
    tag_font = load_font("regular", 40)
    tag_lines = wrap(draw, site["tagline"], tag_font, content_w, 2)
    y = name_y + name_h + 40
    for line in tag_lines:
        draw.text((content_x, y), line, font=tag_font, fill=TEXT_DIM)
        y += round(tag_font.size * 1.38)

    # Site URL, bottom-left, in the mono face the page uses for small labels.
    url_font = load_font("mono", 30)
    url = SITE_URL.split("://", 1)[-1]
    url_h = text_size(draw, url, url_font)[1]
    draw.text((content_x, H - margin - url_h - 6), url, font=url_font, fill=ACCENT)

    out = IMAGES / "og-image.png"
    # Quantizing keeps the file far below the 300 KB budget with no visible
    # loss: the artwork is flat color plus two very soft gradients.
    img.quantize(colors=128, method=Image.MEDIANCUT, dither=Image.NONE).save(
        out, format="PNG", optimize=True
    )
    return out


def make_icons(site: dict) -> list[Path]:
    written = []

    # Opaque icons: apple-touch-icon must not be transparent, and the manifest
    # icons sit on --background_color anyway.
    for name, size, padding in (
        ("apple-touch-icon.png", 180, 0.07),
        ("icon-192.png", 192, 0.06),
        ("icon-512.png", 512, 0.06),
    ):
        path = IMAGES / name
        rounded_badge(size, site["initials"], padding=padding,
                      backdrop=BG).save(path, format="PNG", optimize=True)
        written.append(path)

    # Favicon: an SVG of the same mark, so it stays crisp at any size.
    svg = f"""<!-- Generated by tools/make-og-image.py from js/content.js - do not edit by hand. -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="{escape_xml(site['initials'])}">
  <title>{escape_xml(site['name'])}</title>
  <rect width="64" height="64" rx="14" ry="14" fill="{SURFACE}" stroke="{ACCENT}" stroke-width="3"/>
  <text x="32" y="33" text-anchor="middle" dominant-baseline="central"
        font-family="system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
        font-size="28" font-weight="700" fill="{ACCENT}">{escape_xml(site['initials'])}</text>
</svg>
"""
    favicon = IMAGES / "favicon.svg"
    favicon.write_text(svg, encoding="utf-8")
    written.append(favicon)
    return written


def make_manifest(site: dict) -> Path:
    manifest = {
        "name": f"{site['name']} — Portfolio",
        "short_name": site["name"],
        "description": site["tagline"],
        "start_url": "/",
        "scope": "/",
        "display": "standalone",
        "theme_color": BG,
        "background_color": BG,
        "icons": [
            {"src": "/images/favicon.svg", "sizes": "any", "type": "image/svg+xml"},
            {"src": "/images/icon-192.png", "sizes": "192x192", "type": "image/png",
             "purpose": "any"},
            {"src": "/images/icon-512.png", "sizes": "512x512", "type": "image/png",
             "purpose": "any"},
        ],
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
                        encoding="utf-8")
    return MANIFEST


def escape_xml(value: str) -> str:
    return (value.replace("&", "&amp;").replace("<", "&lt;")
                 .replace(">", "&gt;").replace('"', "&quot;"))


def main() -> None:
    site = read_site_content()
    IMAGES.mkdir(parents=True, exist_ok=True)

    written = [make_og_image(site), *make_icons(site), make_manifest(site)]

    print(f"name={site['name']!r} initials={site['initials']!r} "
          f"tagline={site['tagline']!r}")
    for path in written:
        kb = path.stat().st_size / 1024
        print(f"  wrote {path.relative_to(ROOT)}  ({kb:.1f} KB)")
    if "TBD" in " ".join(site.values()):
        print("\nnote: js/content.js still contains TBD placeholders - re-run "
              "this script after filling them in.")


if __name__ == "__main__":
    main()
