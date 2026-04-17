# How to view the site (so blog posts from manifest show on index)

**Don’t open `index.html` by double‑clicking.** That loads the page as a file (`file:///...`), and the browser will not load `blogs/manifest.json`, so the blog list won’t come from the manifest.

**Use a local web server instead.** From the **project root** (the folder that contains `index.html` and `blogs/`), run one of these:

### Option 1 – Python (no install if you have Python)

```bash
# Python 3
python3 -m http.server 8000
```

Then in your browser open: **http://localhost:8000**

### Option 2 – Node (if you have Node/npm)

```bash
npx serve .
```

Then open the URL it prints (e.g. **http://localhost:3000**).

---

After that, the home page will load over `http://`, `fetch('blogs/manifest.json')` will work, and the posts from `blogs/manifest.json` will appear on the index.
