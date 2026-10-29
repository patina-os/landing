# landing

The landing page of [patina](https://github.com/patina-os/patina), the stylish, free
alternative to Windows for x86-64 and ARM, with its own assistant,
[kortex](https://github.com/patina-os/kortex).

A static page with no build step and no outside requests: no CDN, no analytics, no
Google Fonts. Everything it loads is in this repository.

```text
index.html            the page
assets/site.css       aurora's light palette, the layout, the self-hosted fonts
assets/site.js        the kortex demo, the contour lines and the rings around the wordmark (nothing talks to a server)
assets/fonts/         Sora, Source Sans 3 and JetBrains Mono (latin, latin-ext), with their OFL licences
assets/*.svg          the wordmark from patina's branding/export/, light and dark
assets/*.jpg          the desktop and installer screenshots from patina's docs/screenshots/
```

## Preview

```sh
python3 -m http.server 8000    # then open http://localhost:8000
```

Opening `index.html` directly works too, but browsers block the font preloads on
`file://`, so the console shows harmless errors there.

## Publish

`.github/workflows/pages.yml` publishes `main` to GitHub Pages on every push, as is. Once,
in Settings → Pages, set Source to "GitHub Actions". The site is at
https://patina-os.github.io/landing/.

## Keeping it in step with patina

- The colours are aurora's light palette (`themes/aurora/theme.yaml`, the `light:` block).
- The wordmark is `branding/export/wordmark-blocks.svg`; `wordmark-light.svg` is the same
  drawing with the letters in aurora light's ink. Copy them again when patina's change.
- The screenshots are CI's, scaled to 1600 and 1400 px as JPEG; refresh them per release.
- The ArtCraft apps are the ones listed at [craftingapps.org](https://craftingapps.org).

## Licence

GPL-3.0-or-later, like patina. The fonts are under the SIL Open Font License 1.1
(`assets/fonts/OFL-*.txt`).
