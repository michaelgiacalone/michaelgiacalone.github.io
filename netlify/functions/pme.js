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

    const { name, email, phone, address } = JSON.parse(event.body || '{}');
    if (!name || !email) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Name and email are required.' }) };
    }

    const html =
        '<h2>New Private Market Evaluation Request</h2>' +
        '<p><strong>Name:</strong> '    + name    + '</p>' +
        '<p><strong>Email:</strong> '   + email   + '</p>' +
        '<p><strong>Phone:</strong> '   + (phone   || 'not provided') + '</p>' +
        '<p><strong>Address:</strong> ' + (address || 'not provided') + '</p>';

    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from:    process.env.RESEND_FROM,
            to:      process.env.RESEND_TO,
            subject: 'New PME Request from ' + name,
            html:    html
        })
    });

    const data = await res.json();
    if (data.id) {
        return { statusCode: 200, body: JSON.stringify({ success: true }) };
    }
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to send.' }) };
};
