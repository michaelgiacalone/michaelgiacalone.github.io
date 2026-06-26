# Leads Setup (IDX Broker)

Footer subscribe and the Private Market Evaluation modal submit **directly to IDX** in the browser. No backend server is required — this works on GitHub Pages, Netlify, or any static host.

| Widget ID | Form |
|-----------|------|
| **42573** | Footer email opt-in (“Looking to buy or sell?”) |
| **42572** | Request A Private Market Evaluation modal (`pme-embed.html` in iframe) |

Leads appear in your IDX Broker dashboard under **Leads → Manage**.

## Testing

1. Hard refresh the site (`Cmd+Shift+R`).
2. **Footer** — scroll down, enter a **new email**, click Subscribe.
3. **PME modal** — open “Request A Private Market Evaluation”, fill out the form, submit.
4. Confirm both leads show up in IDX.

Use a fresh email each test — IDX will not create a duplicate for an address already on file.
