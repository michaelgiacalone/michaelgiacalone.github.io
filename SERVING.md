# How to view the site locally

**Don’t open HTML files by double‑clicking** (`file:///...`). Use a local web server from the project root.

## Public site preview

```bash
python3 -m http.server 8000
```

Open **http://localhost:8000**

Layout, navigation, and IDX widgets load. Footer subscribe and PME modal **require Netlify functions** — use `npx netlify-cli dev` to test leads locally.

## Insights editor (private tools)

`insightsCreator.html` and `instructions.html` are for article publishing on your machine only. They are blocked on the live Netlify deploy.

```bash
python3 -m http.server 8000
```

Open **http://localhost:8000/insightsCreator.html**
