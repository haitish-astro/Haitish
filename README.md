# Haitish Gandhi Portfolio

Static multi-page aerospace engineering portfolio.

## Pages

- `index.html` - personal home with Professional and Everyday destinations
- `professional.html` - preserved portfolio introduction, publications, and experience
- `everyday.html` - searchable personal journal
- `story.html?post=POST_ID` - article, save/share controls, and private email replies
- `studio.html` - browser-based writing studio with live preview, local drafts, and import/export
- `content/posts.json` - published stories only; currently empty intentionally
- `about.html` - biography and capability summary
- `projects.html` - clickable project directory
- `projects/` - individual public snapshots for academic, research, and industry work
- `contact.html` - privacy-conscious professional contact page
- `assets/haitish-signature-icon.png` - signature logo used for the nav mark and PNG favicon
- `assets/haitish-signature-logo.png` - cropped transparent signature logo for future brand use
- `assets/favicon.ico` - browser tab icon generated from the signature logo
- `assets/apple-touch-icon.png` - mobile home-screen icon generated from the signature logo
- `artifacts/` - portfolio source materials and live media/document assets
- `artifacts/photos/profile-photo.png` - profile photo used on the site
- `artifacts/photos/hero-aerospace.png` - aerospace hero visual

## Repo Artifact Library

Use `artifacts/` for public portfolio materials only. Do not commit private
career documents, direct personal contact details, transcripts, IDs, private
reports, or proprietary files unless they are intentionally meant to be public.

- `artifacts/photos/` - profile images, project photos, screenshots, renders, and visuals
- `artifacts/pdfs/` - public papers, reports, certificates, and proposals
- `artifacts/documents/` - editable drafts, notes, Word documents, and outlines
- `artifacts/projects/` - project-specific artifact folders
- `artifacts/publications/` - publication PDFs, abstracts, posters, and decks

## Publishing

1. Commit and push these files to `main`.
2. Open the repository hosting settings.
3. Set Source to `Deploy from a branch`.
4. Select branch `main` and folder `/root`.
5. Save and wait for the static site to publish.

No build step is required.

## Writing Studio

Open `/studio.html` to write. Drafts autosave in your browser on this device;
export JSON backups before clearing browser data. Drafts are not uploaded or
published. The studio URL is not authentication: it holds no server-side private
data or publishing credentials. Anyone opening it only sees their own browser's
drafts. Do not use a shared browser profile for private drafts.

Publishing and a moderated, shared comment/reaction service are deferred at the
owner's request. The article reply box currently opens the visitor's email app.
Saved notes and reactions stay on the visitor's device, with no shared counts. No invented posts,
comments, or engagement counts are shipped.

To integrate an approved post manually before a CMS is connected, add its exported
object to the array in `content/posts.json`. Fields: `id`, `title`, `date`
(YYYY-MM-DD), `excerpt`, `body`, and an optional `image` (a relative path into
`artifacts/photos/`, shown as a cover image above the article). Paragraphs use
blank lines, headings use `## `, and quotes use `> `. HTML is rendered as text
for safety.

## Blog Studio

Posts are published from a separate desktop app, Blog Studio, which writes to
`content/posts.json` and `artifacts/photos/` and pushes to `main` using the
Git installation already on this machine. It never touches any other file in
this repo.

Only publish reviewed, public-safe images. Strip location metadata before adding
new personal photos. Four selected photos from the local iCloud folder are now
stored in `artifacts/photos/` as optimized WebP files without EXIF or XMP metadata:
`aiaa-conference.webp`, `cockpit-visit.webp`, `outdoors.webp`, and `garden-walk.webp`.
The first two appear on Professional; the outdoor pair appears on Everyday.
Originals and the other photos remain outside the repository.
