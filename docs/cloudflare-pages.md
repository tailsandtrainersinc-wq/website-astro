# Deploy to Cloudflare Pages

Use these settings in the Cloudflare Pages dashboard so the build finds the project and output.

---

## Build works but I see "Hello World" (Worker) instead of my site

**Cause:** A **Cloudflare Worker** is responding instead of your **Pages** static site. Workers run a script (the default is "Hello World"); Pages serves the files from your `dist` folder.

**Fix:**

1. **Confirm this is a Pages project**
   - In the dashboard go to **Workers & Pages**.
   - Your Astro site must be under **Pages** (not **Workers**).
   - If you only have a Worker (e.g. from "Create application" → Worker), that’s the wrong type. Create a **new** project: **Create application** → **Pages** → **Connect to Git** → pick your repo, then use the build settings below.

2. **Use the Pages URL**
   - Open your **Pages** project (the one connected to this repo).
   - Go to **Deployments** and open the latest successful deployment.
   - Click **Visit site** (or the URL shown there). It should look like `https://<project-name>.pages.dev` (or your custom domain).
   - If you were opening a different URL (e.g. a Worker URL or another subdomain), that’s why you saw "Hello World".

3. **Make sure the domain points at Pages**
   - If you use a **custom domain**: in the **Pages** project go to **Custom domains** and add it there. Don’t attach the same domain to a Worker if you want the static site.
   - If a Worker is on the same domain, either remove that Worker or change its route so it doesn’t overlap with your Pages URL.

4. **Check Build output directory**
   - In the **Pages** project: **Settings** → **Builds & deployments** → **Build configuration**.
   - **Build output directory** must be **`dist`** (no trailing slash). If this is wrong, Pages has nothing to serve and you may get a default response.

**Summary:** Use a **Pages** project (not a Worker), open the **Pages** deployment URL (`*.pages.dev` or your custom domain on Pages), and set **Build output directory** to **`dist`**.

---

## Fix "Root directory not found"

If you see **Root directory not found** (or the build fails to find the project):

1. In your Pages project: **Settings** → **Builds & deployments** → **Build configuration**.
2. Set **Root directory** to **empty** (leave the field blank).
   - The repo root is where `package.json` and `astro.config.mjs` live. Do **not** set a subfolder (e.g. `website` or `app`) unless your app really lives in one.
3. Save and trigger a new deployment.

## Build configuration

| Setting | Value |
|--------|--------|
| **Framework preset** | None (or Astro if listed) |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |
| **Root directory** | *(leave empty)* |
| **Environment variables** | Add any needed (e.g. Node version) |

## Node version (optional)

If the build fails on Node, set an environment variable:

- **Variable:** `NODE_VERSION`  
- **Value:** `20` (or `18`)

(Under **Settings** → **Environment variables** for the Production and/or Preview environment.)

## Summary

- **Root directory** = blank → build runs from repo root.
- **Build output directory** = `dist` → Astro’s default output.
- **Build command** = `npm run build`.

After saving, run **Retry deployment** (or push a new commit) to redeploy.
