const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
};

exports.handler = async function (event) {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    let body;
    try {
        body = JSON.parse(event.body || '{}');
    } catch (e) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body.' }) };
    }

    const { name, email, phone, address } = body;
    if (!name || !email) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Name and email are required.' }) };
    }

    if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM || !process.env.RESEND_TO) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Missing required email environment variables on the server.' })
        };
    }

    const html =
        '<h2>New Private Market Evaluation Request</h2>' +
        '<p><strong>Name:</strong> '    + name    + '</p>' +
        '<p><strong>Email:</strong> '   + email   + '</p>' +
        '<p><strong>Phone:</strong> '   + (phone   || 'not provided') + '</p>' +
        '<p><strong>Address:</strong> ' + (address || 'not provided') + '</p>';

    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: process.env.RESEND_FROM,
                to: [process.env.RESEND_TO],
                subject: 'New PME Request from ' + name,
                html: html
            })
        });

        const data = await res.json().catch(function () { return {}; });
        if (data.id) {
            return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
        }
        const msg = (data && (data.message || data.name)) || 'Resend did not accept the message.';
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Email send failed.', details: msg })
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
