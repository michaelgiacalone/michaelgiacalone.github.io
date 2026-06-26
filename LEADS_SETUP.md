# Leads Setup (IDX Broker)

Newsletter signups and private market evaluation requests are sent to **IDX Broker** via Netlify functions. Each form uses its own IDX widget ID:

| Widget ID | Form | Netlify function |
|-----------|------|------------------|
| **42573** | Footer email opt-in (“Looking to buy or sell?”) | `/.netlify/functions/idx-subscribe` |
| **42572** | Private Market Evaluation modal | `/.netlify/functions/idx-pme` |

Both functions POST to IDX `usersignup.php` with `widgetid` set to the matching ID above, plus a Google reCAPTCHA token from the browser.

## Deploy

1. Push/deploy to Netlify (functions live in `netlify/functions/`).
2. Test on the **live site URL** — `python3 -m http.server` cannot run Netlify functions.
3. Footer subscribe: scroll to footer, use a **new email**, confirm lead in IDX dashboard.
4. PME modal: open **Request A Private Market Evaluation**, submit with real details, confirm lead in IDX.

## Local development

Use Netlify CLI for full lead testing:

```bash
npx netlify-cli dev
```

Then open the URL it prints (usually `http://localhost:8888`).

## Internal editor tools

`insightsCreator.html` and `instructions.html` are redirected away on the public Netlify site. Use them locally with `python3 -m http.server` for article publishing only.
