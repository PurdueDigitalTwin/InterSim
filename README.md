# InterSim project page

Static page (HTML + CSS + vanilla JS, no build step). Live at
<https://purduedigitaltwin.github.io/InterSim/> (the path is case-sensitive), served by GitHub Pages
from the root of `main` in [PurdueDigitalTwin/InterSim](https://github.com/PurdueDigitalTwin/InterSim).

## Run locally

```bash
cd ~/Desktop/IOTJ/Website
python3 -m http.server 8000
# open http://localhost:8000
```

Opening `index.html` directly also works, but a YouTube embed needs the local server.

## Layout

```
index.html                 page content
static/css/style.css       styles
static/js/main.js          demo-video config, architecture scroll walkthrough, twin viewer,
                           real-vs-sim slider, BibTeX copy (+ case-study charts, unused for now)
static/images/             web-sized figures (WebP), converted from the Overleaf images/ and Unity UI thumbnails
static/videos/             put intersim_demo.mp4 here (or use YouTube)
static/videos/twins/       looping orbit videos for the five twins (720p, 30 fps, H.264, no audio)
static/videos/vehicles/    looping showcase videos for the four vehicles (same settings, CRF 27)
_drafts/case-studies.html  case-study section removed for now; see the note at the top of the file to restore it
```

## Before publishing

| Item | Where |
|---|---|
| Demo video (right under the title): set `DEMO_VIDEO.youtubeId`, or `DEMO_VIDEO.mp4` = `static/videos/intersim_demo.mp4` | `static/js/main.js` (top) |
| Paper / Code buttons: set `href`, remove `is-soon` class and the `soon` badge | `index.html`, hero `.buttons` |
| BibTeX: replace the `@misc` entry with the arXiv entry once posted | `index.html`, `#citation` |
| `og:url` / `og:image` assume the `/InterSim/` path | `index.html` `<head>` |

The twin and vehicle videos were re-encoded from `~/Desktop/IOTJ/Videos/Intersections/*_60fps.mp4` and
`~/Desktop/IOTJ/Videos/Vehicles/*_60fps.mp4` (1080p60, 35–71 MB each) to keep the page light. Every other frame is kept, so the 30-second loop stays seamless. To redo one:

```bash
ffmpeg -i DLT_60fps.mp4 -an -vf "select='not(mod(n\,2))',setpts=N/30/TB,scale=1280:720:flags=lanczos" -r 30 \
  -c:v libx264 -preset slow -crf 26 -profile:v high -pix_fmt yuv420p -movflags +faststart static/videos/twins/dlt.mp4
ffmpeg -i static/videos/twins/dlt.mp4 -frames:v 1 -c:v libwebp -quality 80 static/images/twins/dlt_poster.webp
```

Keep videos small for GitHub Pages (files over 100 MB are rejected; aim for under 50 MB) or host the demo on YouTube.

The architecture walkthrough fades parts of the figure with two overlay boxes positioned in percent of
`static/images/architecture.webp` (2400 x 1302, cropped from the Overleaf `architecture.pdf`; `.ov-dt` and `.ov-hitl`
in `style.css`, `ASPECT` in `main.js`). If the figure is re-exported with a different layout or size, adjust those.

## Deploy

This folder is the `PurdueDigitalTwin/InterSim` repo. Pages rebuilds on every push to `main`, usually within a minute:

```bash
cd ~/Desktop/IOTJ/Website
git add -A && git commit -m "Update page" && git push
```

Like the other lab project pages (`llm4ad`, `rci-learning-guide`), it is a separate repo, so the lab homepage repo
`PurdueDigitalTwin.github.io` is untouched. All paths in the page are relative. `.nojekyll` skips the Jekyll build,
and `_drafts/` is in `.gitignore` so the unpublished case-study section stays local.
