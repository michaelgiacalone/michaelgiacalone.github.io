const IDX_SIGNUP_URL =
    'https://keplersiguineau.idxbroker.com/idx/ajax/usersignup.php';
const IDX_WIDGET_ID = '42572';

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
};

function clean(value) {
    return String(value || '').trim();
}

function isEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function parseJson(value) {
    try {
        return JSON.parse(value);
    } catch (e) {
        return null;
    }
}

function idxErrorFromLocation(location) {
    var loc = clean(location).toLowerCase();
    if (!loc) return '';
    var match = loc.match(/[?&]error=([^&#]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

exports.handler = async function (event) {
    var method = String(event.httpMethod || '').toUpperCase();

    if (method === 'OPTIONS') {
        return { statusCode: 204, headers: headers, body: '' };
    }

    if (method !== 'POST') {
        return {
            statusCode: 405,
            headers: Object.assign({}, headers, { Allow: 'POST, OPTIONS' }),
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    var payload = parseJson(event.body || '{}');
    if (!payload || typeof payload !== 'object') {
        return {
            statusCode: 400,
            headers: headers,
            body: JSON.stringify({ error: 'Invalid JSON payload.' })
        };
    }

    var firstName = clean(payload.firstName);
    var lastName = clean(payload.lastName);
    var email = clean(payload.email);
    var phone = clean(payload.phone);
    var recaptchaToken = clean(payload.recaptchaToken);

    if (!firstName || !lastName) {
        return {
            statusCode: 400,
            headers: headers,
            body: JSON.stringify({ error: 'First and last name are required.' })
        };
    }

    if (!email || !isEmail(email)) {
        return {
            statusCode: 400,
            headers: headers,
            body: JSON.stringify({ error: 'A valid email is required.' })
        };
    }

    if (!recaptchaToken) {
        return {
            statusCode: 400,
            headers: headers,
            body: JSON.stringify({
                error: 'Captcha verification required. Click a form field and try again.'
            })
        };
    }

    var body = new URLSearchParams({
        action: 'addLead',
        signupWidget: 'true',
        widgetid: IDX_WIDGET_ID,
        contactType: 'direct',
        contactRoutingAgent: '0',
        firstName: firstName,
        lastName: lastName,
        email: email,
        phone: phone,
        recaptchaToken: recaptchaToken,
        submit: 'Sign Up!'
    });

    try {
        var res = await fetch(IDX_SIGNUP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'ARG-Naples-PME/1.0'
            },
            body: body.toString(),
            redirect: 'manual'
        });

        var location = res.headers.get('location') || '';
        var idxError = idxErrorFromLocation(location);

        if (idxError === 'captcha') {
            return {
                statusCode: 400,
                headers: headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Captcha verification failed. Please refresh and try again.'
                })
            };
        }

        if (idxError) {
            return {
                statusCode: 400,
                headers: headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Submission failed (' + idxError + '). Please try again.'
                })
            };
        }

        if (res.status === 301 || res.status === 302) {
            return {
                statusCode: 200,
                headers: headers,
                body: JSON.stringify({ success: true })
            };
        }

        var text = await res.text().catch(function () {
            return '';
        });
        if (/error/i.test(text)) {
            return {
                statusCode: 400,
                headers: headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Submission failed. Please try again.'
                })
            };
        }

        return {
            statusCode: 200,
            headers: headers,
            body: JSON.stringify({ success: true })
        };
    } catch (err) {
        return {
            statusCode: 500,
            headers: headers,
            body: JSON.stringify({
                error: 'Server error while submitting to IDX.',
                details: err && err.message ? String(err.message) : 'unknown'
            })
        };
    }
};
