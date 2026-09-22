# Portfolio

A one-page personal portfolio for GitHub Pages. Plain HTML, CSS and JavaScript:
no build step, no frameworks, no npm. It uses the Nord color palette and has a
dark/light theme toggle.

Placeholders (name, links, text) are marked `TBD` throughout.

## File layout

```
index.html            the page (all sections)
css/themes/nord.css   color + font tokens only (the theme)
css/style.css         layout and components (uses theme tokens only)
js/main.js            theme toggle, mobile nav, scrolled header, footer year
images/               favicon and other images
.nojekyll             tells GitHub Pages to serve files as-is (no Jekyll)
```

## Preview locally

From the project root:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Edit content

For now, edit the text directly in `index.html` (search for `TBD`).
A separate `content.js` data file for content is planned for milestone M3.

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
