/**
 * Footer newsletter → /.netlify/functions/subscribe
 * Parses JSON on both success and error so real messages (Resend, missing env) show in .mc-status.
 */
(function () {
    function showError(statusEl, msg) {
        if (!statusEl) return;
        statusEl.textContent = msg;
        statusEl.style.color = '#c00';
    }

    function attach() {
        var form = document.getElementById('mc-form');
        var status = form && form.querySelector('.mc-status');
        if (!form || !status) return;

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var email = form.querySelector('[name="EMAIL"]').value;
            var btn = form.querySelector('[type="submit"]');
            btn.disabled = true;
            btn.value = 'Sending…';

            var payload = { email: email, sourcePage: window.location.href };

            fetch('/.netlify/functions/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
                .then(function (r) {
                    return r.text().then(function (text) {
                        var data = {};
                        try {
                            data = text ? JSON.parse(text) : {};
                        } catch (err) {
                            data = { error: text || 'Non-JSON response', raw: true };
                        }
                        return { ok: r.ok, status: r.status, data: data };
                    });
                })
                .then(function (result) {
                    if (result.ok && result.data && result.data.success) {
                        status.textContent = 'Thank you for subscribing!';
                        status.style.color = '#111';
                        form.querySelector('[name="EMAIL"]').value = '';
                    } else {
                        var d = result.data || {};
                        var line =
                            d.details ||
                            d.error ||
                            (d.missing
                                ? 'Missing Netlify env: ' +
                                  Object.keys(d.missing)
                                      .filter(function (k) {
                                          return d.missing[k];
                                      })
                                      .join(', ')
                                : '') ||
                            'Error (' + result.status + ').';
                        showError(status, line);
                        if (typeof console !== 'undefined' && console.warn) {
                            console.warn('[subscribe]', result.status, d);
                        }
                    }
                    btn.disabled = false;
                    btn.value = 'Subscribe';
                })
                .catch(function (err) {
                    showError(status, 'Network error — check connection or try again.');
                    btn.disabled = false;
                    btn.value = 'Subscribe';
                    if (typeof console !== 'undefined' && console.warn) console.warn(err);
                });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attach);
    } else {
        attach();
    }
})();
