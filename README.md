# Portfolio

A one-page personal portfolio for GitHub Pages. Plain HTML, CSS and JavaScript:
no build step, no frameworks, no npm. It uses the Nord color palette and has a
dark/light theme toggle.

Placeholders (name, links, text) are marked `TBD` throughout.

## File layout

```
index.html            the page (all sections) + every meta/social tag
css/themes/nord.css   color + font tokens only (the theme)
css/style.css         layout and components (uses theme tokens only)
js/content.js         all site content (name, links, projects, skills...)
js/main.js            renders content.js into the page, theme toggle, nav
js/globe.js           the interactive globe in the "At a glance" card
tools/make-og-image.py generates the share image, icons and site.webmanifest
images/               favicon, icons and the share image (generated)
site.webmanifest      PWA/home-screen metadata (generated)
robots.txt            allows everything, points at the sitemap
sitemap.xml           the single page + its lastmod date
.nojekyll             tells GitHub Pages to serve files as-is (no Jekyll)
```

## Preview locally

From the project root:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Edit content

Almost everything the page shows — name, initials, tagline, links, about text,
projects, skills — lives in `js/content.js`. Edit that file and reload; nothing
else needs to change. Search for `TBD` to find the remaining placeholders.

The handful of strings that cannot come from JavaScript (the `<title>` and the
description / Open Graph / Twitter tags, which crawlers read before any script
runs) live in the `<head>` of `index.html` and are also marked `TBD`.

## Re-theme

1. Copy `css/themes/nord.css` to a new file, for example `css/themes/mytheme.css`.
2. Change the token values (colors, fonts) in the copy. Keep the token names.
3. In `index.html`, change the theme `<link>` to point at the new file.

`css/style.css` uses only `var(--token)` values, so it does not need to change.

## Deploy to GitHub Pages

The site is served at `https://aegisssc.github.io`.

1. Create a public GitHub repository named exactly `aegisssc.github.io`.
2. Add it as a remote and push the `main` branch:
   ```sh
   git remote add origin https://github.com/aegisssc/aegisssc.github.io.git
   git add .
   git commit -m "Initial site"
   git push -u origin main
   ```
3. On GitHub, open the repository's **Settings → Pages**. Under **Build and deployment**,
   set **Source** to **Deploy from a branch**, choose branch **main** and folder **/ (root)**, then save.
4. After a minute or two the site is live at `https://aegisssc.github.io`.

## Launch checklist

**0. Hero photo (optional).** Drop a square image at `images/avatar.jpg`
(400-800px, JPG/PNG/WebP) and set `avatar: 'images/avatar.jpg'` in
`js/content.js`. Leave it empty to show the initials instead; a bad path
falls back to them too.

**1. Fill in the placeholders.** Search for `TBD` in `js/content.js` (name,
initials, tagline, about, email, LinkedIn) and in the `<head>` of `index.html`
(title, description, `og:*` and `twitter:*` tags — the name appears there as
plain text because crawlers do not run JavaScript).

**2. Regenerate the share image and icons.** From the project root:

```sh
python3 tools/make-og-image.py
```

That one command reads `name`, `initials` and `tagline` straight out of
`js/content.js` and rewrites:

| File | Size | Used by |
| --- | --- | --- |
| `images/og-image.png` | 1200x630 | `og:image` / `twitter:image` |
| `images/apple-touch-icon.png` | 180x180 | iOS home screen |
| `images/icon-192.png`, `images/icon-512.png` | 192, 512 | `site.webmanifest` |
| `images/favicon.svg` | scalable | browser tab |
| `site.webmanifest` | — | `name`, `short_name`, theme colors, icons |

It needs Python 3 with [Pillow](https://pypi.org/project/Pillow/) and a DejaVu
system font (Debian/Ubuntu: `apt install fonts-dejavu-core`); it exits with a
clear error rather than silently substituting a fallback font. `node` is used
to read `content.js` when it is installed, with a regex parse as the fallback.
Colors come from the Nord dark palette in `css/themes/nord.css` — change
`BG`/`TEXT`/`ACCENT` near the top of the script to match a different theme, and
`SITE_URL` if the site ever moves.

**3. Check the tags.** All of them are in the `<head>` of `index.html`:
`description`, `canonical`, `og:type|site_name|title|description|url|image`
(with `image:width`, `image:height`, `image:alt`), the
`twitter:card=summary_large_image` set, `theme-color`, the icon links and the
manifest link. Keep the anti-flash `<script>` where it is — it must run before
any stylesheet loads.

**4. Bump the sitemap.** `sitemap.xml` has one `<url>` entry; update its
`<lastmod>` to the launch date. `robots.txt` allows everything and points at it.

**5. Audit the live URL.** After the deploy has gone out, run Lighthouse
against the real site (needs Chrome installed):

```sh
npx lighthouse https://aegisssc.github.io/ \
  --only-categories=performance,accessibility,best-practices,seo \
  --preset=desktop --view
```

Or, with no local tooling at all, use PageSpeed Insights, which runs Lighthouse
for you and reports mobile and desktop separately:

<https://pagespeed.web.dev/analysis?url=https%3A%2F%2Faegisssc.github.io%2F>

**6. Preview the social card.** Paste the URL into a validator to confirm the
image and text render, and to refresh the crawler's cache:

- Facebook / Open Graph: <https://developers.facebook.com/tools/debug/>
- X / Twitter: <https://cards-dev.twitter.com/validator>
- LinkedIn: <https://www.linkedin.com/post-inspector/>
