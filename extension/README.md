# What Anime Is This? (Chrome extension)

Right-click an anime image on any website and choose **What anime is this?**. A tab opens on
[anilumi.in/what-anime-is-this](https://anilumi.in/what-anime-is-this) with the image link, and the search runs
straight away (title, episode, timestamp, preview clip, where to watch, Hindi dub). On videos or anywhere else on a
page, the menu opens the search page, where you can paste a screenshot or pick a frame from a clip.

- Manifest V3, one permission: `contextMenus`. No host permissions, no content scripts, no storage, no analytics.
- It only opens a tab. The image link goes to the AniLumi page, which sends it to [trace.moe](https://trace.moe) for matching.
- Only `https://` image links can be searched this way; for `data:`/`blob:` images, screenshot and paste instead.

## Try it locally

1. Open `chrome://extensions`, turn on **Developer mode**.
2. **Load unpacked** and choose this `extension/` folder.
3. Right-click any anime image → **What anime is this?**

## Build the store zip

```bash
bash scripts/extension-zip.sh
```

This writes `extension.zip` at the repo root (git-ignored). Bump `version` in `manifest.json` before each upload.

## Chrome Web Store listing (draft)

- **Name:** What Anime Is This? by AniLumi
- **Summary (≤132 characters):** Right-click any anime screenshot to find the anime, episode and timestamp, plus where to watch it. Free, no sign-up.
- **Category:** Entertainment
- **Description:**

  Saw an anime scene on Reddit, X, Pinterest or a fan site and want to know what it is? Right-click the image and
  choose "What anime is this?". AniLumi finds the anime, the exact episode and the minute the scene is from, with a
  short preview clip to confirm, then shows where to watch it legally, its watch order and whether it has an
  official Hindi dub.

  - Works on any https image on any website
  - Episode and timestamp, not just the title
  - Free, no account, no sign-up
  - One permission (the right-click menu); it reads nothing on the pages you visit

  Matching is powered by trace.moe, which compares the frame with tens of thousands of hours of anime episodes.
  Fan art and edited images usually won't match; clean frames from the episode work best.

- **Privacy (single purpose / data use):** Single purpose: open AniLumi's anime scene search for an image you
  right-click. The extension collects and stores no data and has no access to page content. When you use it, the
  image's link is passed to anilumi.in in the tab it opens, and that page sends it to trace.moe for matching.
  Privacy policy URL: https://anilumi.in/privacy
- **Screenshots needed (1280×800):** the right-click menu on an anime image; a result card with episode and
  timestamp; the "where to watch / Hindi dub" links.
