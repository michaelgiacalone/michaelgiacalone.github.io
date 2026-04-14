const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

exports.handler = async function (event) {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: 'Method Not Allowed' };
    }

    const { email } = JSON.parse(event.body || '{}');
    if (!email) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Email is required.' }) };
    }

    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from:    process.env.RESEND_FROM,
            to:      process.env.RESEND_TO,
            subject: 'New Newsletter Subscriber — Arpin & Giacalone',
            html:    '<p>New subscriber: <strong>' + email + '</strong></p>'
        })
    });

    const data = await res.json();
    if (data.id) {
        return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to send.' }) };
};
