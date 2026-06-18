# ARG Naples — Insights Editor Handout

Give this to the person publishing Insights articles.

**Tools run on a private computer only** — `insightsCreator.html` and `instructions.html` are not part of the public website. Open them via `python3 -m http.server` on your machine.

Full guide: open `instructions.html` in the browser after starting the local server.

---

## What you do (3 steps)

### 1. Open the tool

```bash
cd /path/to/giacalone
python3 -m http.server
```

Browser: **http://localhost:8000/insightsCreator.html**

---

### 2. Add content

| Step | What you do |
|------|-------------|
| **Step 1** | Drop a Word file (`.docx`) **or** paste the article text |
| **Step 2** | Drop photos (optional) — **keep the file names** |
| **Step 3** | Check auto-filled fields — edit if needed — **Refresh preview** |

**First line** = headline · **Second line** (optional) = subheadline

**Formatting** (usually on their own line; put a blank line before and after images/CTAs):

```
headlineImage="cover-photo.jpg"     ← wide banner under title
inlineImage="chart.png"             ← smaller centered image
addCta title="Your button label"    ← navy button → evaluation form
[link text](communities/port.html)  ← inline link in a sentence
hyperlink label="…" url="…"       ← standalone link line
## Section heading
> Pull quote
```

- **Web image:** `headlineImage="https://example.com/photo.jpg"`
- **Local file:** name must match a file dropped in Step 2
- Missing image on live site = nothing shown (no broken icon)

---

### 3. Download and publish

1. Click **Download ZIP package**
2. Unzip into the website folder — article lands in **`Insights/`**, photos in **`assets/`**
3. Open `blog.html`, paste the listing snippet at the **top** of `<div class="blog-grid">` (links use `Insights/your-article.html`)
4. Commit and push (Terminal or GitHub Desktop)

```bash
git add .
git commit -m "Add Insights: [headline]"
git push
```

Site updates in a few minutes (Netlify).

---

## Tips

- Author is **remembered** for next time
- Date defaults to **today**
- Category is **guessed** from your text — change in Step 3 if needed
- Cover image requires **`headlineImage="…"`** in the text (not automatic from first photo)
- Use **only `addCta`** for call-to-action buttons in the article (no duplicate footer button)

---

## If something goes wrong

| Problem | Fix |
|---------|-----|
| Word file won’t load | Save as `.docx` or paste text into Step 1 |
| No images in preview | Drop images in Step 2, then Refresh preview |
| CTA missing | `addCta title="…"` on its own line; blank line around it |
| Article not on Insights page | Paste listing snippet into `blog.html` |
| Duplicate headline in body | First line is used as headline and removed from body automatically |

---

*Internal tools: `insightsCreator.html`, `instructions.html` — keep on private server only*
