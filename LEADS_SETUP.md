# Leads Setup (Netlify + Resend)

This project already posts newsletter signups to `/.netlify/functions/subscribe`.
Use these steps when you move the code to another person's computer/Netlify account.

## 1) Create Resend

- Create a Resend account.
- Verify a sending domain.
- Create an API key.

## 2) Set Netlify Environment Variables

In Netlify site settings, add:

- `RESEND_API_KEY` - your Resend API key
- `RESEND_FROM` - sender email (for example `Leads <leads@yourdomain.com>`)
- `RESEND_TO` - fallback recipient email
- `DEFAULT_FIRM` - default firm label for subject/body (example: `Arpin & Giacalone`)

Optional (for multiple firms with one codebase):

- `FIRM_TO_EMAIL_JSON` - JSON map for firm-specific routing.

Example:

```json
{
  "Arpin & Giacalone": "team-a@example.com",
  "Another Firm": "team-b@example.com"
}
```

If a submitted `firm` value matches this map, the function sends to that address.
If not, it falls back to `RESEND_TO`.

## 3) Deploy

- Push/deploy to Netlify.
- Submit the footer subscribe form on any page.

## 4) What gets captured now

Each signup email includes:

- subscriber email
- firm label (from payload, or `DEFAULT_FIRM`, or host fallback)
- source page URL
- request host

No paid CRM is required to start. This is the quickest low-cost capture flow.
