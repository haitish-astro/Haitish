# Haitish Gandhi Portfolio

Static multi-page aerospace engineering portfolio with a glassy dark/light design,
a three.js hero, and an everyday journal. No build step: it is plain HTML, CSS, and
JavaScript served by GitHub Pages (`main` branch, `/` root).

## Pages

- `index.html` - home: 3D hero, the Professional / Everyday split, selected work, latest journal notes
- `professional.html` - the portfolio landing page: publications, project highlights, industry work, toolbox, experience
- `about.html` - biography, technical focus, involvement, certifications and awards
- `projects.html` - project directory; `projects/` holds one page per project
- `contact.html` - contact page
- `everyday.html` - searchable personal journal; `story.html?post=POST_ID` is a single note with anonymous comments
- `404.html` - not-found page (uses root-absolute URLs so it works from any path)
- `studio.html` - legacy in-browser writing studio (unlinked, `noindex`); superseded by the Blog Studio desktop app
- `content/posts.json` - published journal posts (managed by Blog Studio)

## Design system

Everything is driven by CSS custom properties in `styles.css`.

- **Theme**: dark by default, full light theme via `<html data-theme="light">`. A tiny inline script in every `<head>` sets the theme before first paint (stored choice in `localStorage`, else the OS preference). Hero banners stay dark "space" panels in both themes.
- **Glass**: cards share one recipe (translucent gradient, 1px highlight, `backdrop-filter`), with an opaque fallback when `backdrop-filter` is unsupported.
- **Fonts**: Inter and Space Grotesk, self-hosted in `assets/fonts/` (SIL Open Font License, licenses alongside). No third-party font requests.
- **3D**: `scripts/scene.js` (three.js, vendored in `assets/`) draws the orbit scene. It loads lazily after first paint, pauses off-screen or in a hidden tab, renders one still frame under `prefers-reduced-motion`, lowers its resolution automatically on slow devices, and is skipped entirely when WebGL is unavailable or Data Saver is on. The page is complete without it.
- **Motion**: reveal-on-scroll, pointer sheen, card tilt and counters live in `scripts/main.js`; all respect `prefers-reduced-motion`.
- **Print**: a print stylesheet strips the effects so pages print cleanly.

### Stylesheets

- `styles.css` - the whole design system, used by every page
- `journal.css` - journal and story styles. **Blog Studio injects this file into its live preview**, so it must stay class-scoped (no bare `body`/`button` rules) and keep its `var(--x, fallback)` chains
- `hydroquad.css` - case-study layout shared by the five case-study project pages

## Adding a project

1. Copy an existing page in `projects/` (use `hydroquad.html` for a full case study, `paver-canopy.html` for a short snapshot).
2. Add a card to `projects.html` (use `.project-media` with an `<img>` for a real cover, or `.project-media.is-abstract` with `data-label` for a generated one).
3. Add the URL to `sitemap.xml`.

## Comments

Reader comments on journal notes are stored in Firebase Firestore and shown publicly as "Anonymous". An optional name/email is written to a separate, rules-protected collection that the public site cannot read; only the Blog Studio desktop app (using an admin key that never ships with the site) can read it and moderate comments. The Firebase web config in `scripts/journal.js` is public by design; the API key is restricted to this site's domains in Google Cloud.

## Repo artifact library

Use `artifacts/` for public portfolio materials only. Do not commit private
career documents, direct personal contact details, transcripts, IDs, private
reports, or proprietary files unless they are intentionally meant to be public.

- `artifacts/photos/` - profile and hero images (WebP), journal and conference photos
- `artifacts/projects/` - project-specific figures (see `CASE-STUDY-SOURCES.md`)
- `artifacts/pdfs/`, `artifacts/documents/`, `artifacts/publications/` - public papers, drafts, and decks

Only publish reviewed, public-safe images. Strip location metadata before adding
new personal photos. Originals stay outside the repository.

## Publishing posts

Journal posts are published from the Blog Studio desktop app, which edits only
`content/posts.json` and `artifacts/photos/` and pushes to `main` with the Git
installation on the author's machine. Post fields: `id`, `title`, `date`
(YYYY-MM-DD), `excerpt`, `body`, and an optional `image`. Paragraphs use blank
lines, headings use `## `, and quotes use `> `. HTML is rendered as text.

## Local preview

```bash
npx http-server . -p 4180 -c-1
```

Then open http://localhost:4180/ (any static server works; do not open the files
with `file://`, since the journal loads `content/posts.json` with `fetch`).
