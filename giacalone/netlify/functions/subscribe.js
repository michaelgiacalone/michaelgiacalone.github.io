const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
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
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: 'Method Not Allowed' };
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

    if (!recipient || !process.env.RESEND_API_KEY || !process.env.RESEND_FROM) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Missing required email environment variables.' })
        };
    }

    const html =
        '<h2>New Newsletter Subscriber</h2>' +
        '<p><strong>Email:</strong> ' + email + '</p>' +
        '<p><strong>Firm:</strong> ' + firm + '</p>' +
        '<p><strong>Source:</strong> ' + sourcePage + '</p>' +
        '<p><strong>Host:</strong> ' + (host || 'unknown') + '</p>';

    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from:    process.env.RESEND_FROM,
            to:      recipient,
            subject: 'New Subscriber — ' + firm,
            html:    html
        })
    });

    const data = await res.json();
    if (data.id) {
        return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to send.' }) };
};
