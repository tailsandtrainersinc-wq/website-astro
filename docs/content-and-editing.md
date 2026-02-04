# Content Directory: Editing and How It Renders

This guide explains where the site’s text and events live, how to edit them (on GitHub or locally with Git), and how that content becomes the pages you see. It’s written for both **non-developers** (editing copy and events) and **developers** (how the content system and rendering work).

---

## Overview

- **Content** = Markdown (`.md`) files in `src/content/`. You edit these to change headlines, event listings, feature pages, and footer/hero text.
- **Rendering** = Astro reads those files at build time and turns them into HTML. No database: the content is in the repo.
- **Publishing** = You save changes in Git (on GitHub or locally) and push; the site is rebuilt (e.g. on Cloudflare Pages) and the new content appears.

---

## Where Content Lives

All editable content is under **`src/content/`** in three folders:

| Folder | Purpose | Used on |
|--------|--------|--------|
| **`site/`** | One file: site-wide hero, CTA, and footer text | Home page (hero, “Join Our Mission” block, footer) |
| **`features/`** | One file per “pillar” (e.g. Community, Education) | Home page “What We Do” cards, `/features`, and `/features/[id]` pages |
| **`events/`** | One file per event | Calendar page (`/calendar`) and event details in the calendar |

- **Non-developers:** Edit the `.md` files in these folders. File names and the `---` block at the top matter; see below.
- **Developers:** Collections are defined in `src/content.config.ts`; pages and components use `getCollection` / `getEntry` / `render` from `astro:content`.

---

## How a Content File Is Structured

Each content file has two parts:

1. **Frontmatter** — Between the first `---` and second `---`. It’s YAML: key-value pairs (and optional lists). This is the “data” (title, date, icon, etc.) that the site uses in headings, cards, and metadata.
2. **Body** — Everything after the second `---`. It’s **Markdown** (headings, lists, bold, links). For features and events this becomes the main page content; for `site/settings.md` there is no body (only frontmatter).

### Example: Event file (`src/content/events/community-meetup.md`)

```yaml
---
title: Monthly Community Meetup
description: Casual gathering for connection and support.
date: 2026-02-22
startTime: "6:00 PM"
endTime: "8:00 PM"
location: The Hub, 456 Oak Ave
---

Our monthly meetup is a low-key space to connect...

**What to expect:**
- A welcoming, casual environment
- Optional name tags and icebreakers
```

- **Frontmatter** (`title`, `description`, `date`, etc.) → Used in the calendar list and event detail (title, time, location).
- **Body** (the paragraph and list) → Rendered as the event description when you click an event on the calendar.

### Example: Feature file (`src/content/features/community.md`)

- **Frontmatter:** `title`, `description`, `icon` (e.g. `tabler:users`), `order` (for sort order on the home page).
- **Body:** Rendered on the feature’s page at `/features/community` (the URL segment comes from the **file name** without `.md`).

### Site settings (`src/content/site/settings.md`)

- **Frontmatter only:** `heroTitle`, `heroSubtitle`, `heroTagline`, `ctaTitle`, `ctaBody`, `footerDescription`. No body.
- These values drive the hero, CTA block, and footer on the home page.

**Important:**  
- Don’t remove the two `---` lines.  
- Keep frontmatter keys exactly as in existing files (and in `content.config.ts`), or the build can fail.  
- For dates use `YYYY-MM-DD`.  
- File names (without `.md`) become URLs: `community.md` → `/features/community`, `allyship-workshop.md` → one event entry with that id.

---

## Editing on GitHub

Good for small copy changes and adding events if you don’t use Git locally.

1. Open the repo on **GitHub**.
2. Go to **`src/content/`** and then into the folder you need:
   - **Site-wide text:** `src/content/site/settings.md`
   - **Feature pillars:** `src/content/features/` → pick the `.md` file (e.g. `community.md`)
   - **Events:** `src/content/events/` → pick an event file or add a new one
3. Click the file name, then click the **pencil icon** (“Edit this file”).
4. Edit the frontmatter (between the two `---`) and/or the body (below the second `---`). Use Markdown for the body (e.g. `**bold**`, `- list`, `[text](url)`).
5. Scroll down, add a short **Commit message** (e.g. “Update hero title” or “Add Pride Planning event”), choose “Commit directly to the main branch” (or your default branch), and click **Commit changes**.

After the commit, if the site is connected to Cloudflare Pages (or similar), a new build runs and the updated content appears once the build finishes.

**Adding a new event on GitHub:**  
- In `src/content/events/` click **Add file** → **Create new file**.  
- Name the file with a short slug, e.g. `pride-planning.md`. That slug is the event’s internal id.  
- Add frontmatter and body using an existing event file as a template (same keys: `title`, `description`, `date`, `startTime`, `endTime`, `location`).

---

## Editing Locally with Git

Better for bigger edits, many files, or if you’re comfortable in a terminal/editor.

### One-time setup

1. **Clone the repo** (if you haven’t already):
   ```bash
   git clone https://github.com/YOUR_ORG/website-astro.git
   cd website-base
   ```
2. **Install dependencies:**
   ```bash
   pnpm install
   ```
3. **Run the dev server** (optional but helpful to see changes as you edit):
   ```bash
   pnpm run dev
   ```
   Open the URL shown (e.g. `http://localhost:4321`). Edits to files in `src/content/` are picked up when you save.

### Edit and publish

1. Open the content file in your editor (e.g. `src/content/site/settings.md`, or a file under `features/` or `events/`).
2. Change the frontmatter and/or body. Save.
3. **Commit and push:**
   ```bash
   git add src/content/site/settings.md   # or the file(s) you changed
   git commit -m "Update hero and CTA text"
   git push
   ```
   Or add all changed files: `git add .` then `git commit` and `git push`.

After you push, the host (e.g. Cloudflare Pages) rebuilds the site and the new content goes live.

**Non-developers:** You can use GitHub Desktop or another Git GUI: open the repo, edit the file, then “Commit” and “Push” instead of using the commands above.

---

## How Content Becomes Pages (Rendering)

This section is for developers (or anyone curious how it works under the hood).

- **Collections** are defined in **`src/content.config.ts`**: `site`, `features`, `events`. Each collection points at a folder under `src/content/` and a schema (frontmatter keys and types).
- **Build time:** Astro loads all `.md` files in those folders, checks them against the schema, and makes the data available via `astro:content`.

### Where each collection is used

| Collection | Used in | How |
|------------|--------|-----|
| **site** | `Hero.astro`, `CTA.astro`, `Footer.astro` | `getCollection("site")` → take first entry’s `data` for hero title/subtitle, CTA title/body, footer description. |
| **features** | `Features.astro`, `pages/features/index.astro`, `pages/features/[id].astro` | `getCollection("features")` for the list (sorted by `order`). For a single feature page, `getStaticPaths` returns one path per feature; the page uses `getEntry("features", id)` and `render(entry)` to output the Markdown body as `<Content />`. |
| **events** | `pages/calendar.astro`, `EventCalendar.tsx` | `getCollection("events")` in `calendar.astro`; the list is passed as props to `EventCalendar`. Event titles, dates, times, location come from frontmatter; the Markdown body is passed as `body` and rendered in the calendar UI with `ReactMarkdown`. |

### File name → URL

- **Features:** The file name (without `.md`) is the **id** and the URL segment.  
  Example: `src/content/features/community.md` → id `community` → page **`/features/community`**.
- **Events:** The file name is the event’s **id** (used in the calendar data). Events don’t have their own URLs; they appear on `/calendar` and in the calendar detail view.
- **Site:** Only one file, `settings.md`; it’s not used in URLs.

### Summary for developers

- Content is **static**: Markdown in `src/content/` with a schema in `content.config.ts`.
- Pages and components use **`getCollection`** / **`getEntry`** and, for feature/event bodies, **`render()`** (Astro) or **`ReactMarkdown`** (events in the calendar).
- Changing content = editing `.md` files and redeploying (Git push → build). No CMS or database involved.

---

## Quick Reference: “I want to change…”

| Goal | File(s) to edit |
|------|------------------|
| Hero headline, tagline, or subtitle | `src/content/site/settings.md` |
| “Join Our Mission” block (title + paragraph) | `src/content/site/settings.md` |
| Footer short description | `src/content/site/settings.md` |
| What We Do cards on home page (title, description, icon, order) | `src/content/features/*.md` |
| Full text of a feature page (e.g. /features/community) | Same file: `src/content/features/community.md` (frontmatter + body) |
| Add or change a feature pillar | Add or edit a `.md` in `src/content/features/`; filename = URL slug |
| Events on the calendar | `src/content/events/*.md` — one file per event; add a new `.md` to add an event |

After editing, **save in GitHub** (Commit changes) or **commit and push** locally so the site rebuilds and your changes go live.
