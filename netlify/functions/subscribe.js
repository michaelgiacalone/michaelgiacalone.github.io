const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
};

function parseJson(value) {
    try {
        return JSON.parse(value);
    } catch (e) {
        return null;
    }
}

function clean(value) {
    return String(value || '').trim();
}

function isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

exports.handler = async function (event) {
    const method = String(event.httpMethod || '').toUpperCase();

    if (method === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    /* Opening this URL in a browser uses GET — not an error, just the wrong way to test */
    if (method === 'GET' || method === 'HEAD') {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                ok: false,
                message:
                    'This URL is for the newsletter API only. Use POST with JSON {"email":"..."}. ' +
                    'Submit the email form on the website to subscribe.'
            })
        };
    }

    if (method !== 'POST') {
        return {
            statusCode: 405,
            headers: Object.assign({}, headers, { Allow: 'POST, OPTIONS' }),
            body: JSON.stringify({ error: 'Method not allowed', useMethod: 'POST' })
        };
    }

    const payload = parseJson(event.body || '{}');
    if (!payload || typeof payload !== 'object') {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON payload.' }) };
    }

    const email = clean(payload.email || payload.EMAIL);
    if (!email || !isEmail(email)) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'A valid email is required.' }) };
    }

    const referer = clean(event.headers && (event.headers.referer || event.headers.referrer));
    const host = clean(event.headers && (event.headers.host || event.headers['x-forwarded-host']));
    const sourcePage = clean(payload.sourcePage || referer || 'unknown');
    const firm = clean(payload.firm || process.env.DEFAULT_FIRM || host || 'Unknown Firm');

    const routeMap = parseJson(process.env.FIRM_TO_EMAIL_JSON || '{}') || {};
    const routedTo = clean(routeMap[firm]);
    const fallbackTo = clean(process.env.RESEND_TO);
    const recipient = routedTo || fallbackTo;

    const hasKey = !!clean(process.env.RESEND_API_KEY);
    const hasFrom = !!clean(process.env.RESEND_FROM);
    const hasTo = !!recipient;

    if (!hasKey || !hasFrom || !hasTo) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Missing Netlify environment variables for email.',
                missing: {
                    RESEND_API_KEY: !hasKey,
                    RESEND_FROM: !hasFrom,
                    RESEND_TO_or_FIRM_TO_EMAIL_JSON_route: !hasTo
                },
                hint: 'Set RESEND_API_KEY, RESEND_FROM, and RESEND_TO in Netlify, then redeploy.'
            })
        };
    }

    const html =
        '<h2>New Newsletter Subscriber</h2>' +
        '<p><strong>Email:</strong> ' + email + '</p>' +
        '<p><strong>Firm:</strong> ' + firm + '</p>' +
        '<p><strong>Source:</strong> ' + sourcePage + '</p>' +
        '<p><strong>Host:</strong> ' + (host || 'unknown') + '</p>';

    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: process.env.RESEND_FROM,
                to: [recipient],
                subject: 'New Subscriber — ' + firm,
                html: html
            })
        });

        const data = await res.json().catch(function () { return {}; });
        if (res.ok && data.id) {
            return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
        }
        const msg =
            (data && (data.message || data.name)) ||
            ('Resend HTTP ' + res.status + (data && data.statusCode ? ' — see Resend dashboard.' : ''));
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Email send failed.',
                details: msg
            })
        };
    } catch (err) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Server error while sending.',
                details: err && err.message ? String(err.message) : 'unknown'
            })
        };
    }
};
