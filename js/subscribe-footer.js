/**
 * Footer email opt-in — IDX lead signup widget (42573)
 * Email-only UI; submits to IDX via Netlify function with reCAPTCHA verification.
 */
(function () {
    'use strict';

    var IDX_SRC =
        'https://keplersiguineau.idxbroker.com/idx/leadsignupwidget.php?widgetid=42573';
    var IDX_WIDGET_ID = 42573;
    var RECAPTCHA_SITE_KEY = '6LcUhOYUAAAAAF694SR5_qDv-ZdRHv77I6ZmSiij';
    var RECAPTCHA_ACTION = 'widgetRegistration';
    var SUBMIT_URL = '/.netlify/functions/idx-subscribe';

    var widgetLoaded = false;
    var observer = null;

    function getWidgetRoot() {
        return document.getElementById('idxSubscribeWidget');
    }

    function getSignupBlock(root) {
        if (!root) return null;
        return root.querySelector('.LeadSignup');
    }

    function getStatusEl() {
        return document.getElementById('idx-subscribe-status');
    }

    function showThanks() {
        var status = getStatusEl();
        if (!status) return;
        status.textContent = 'Thank you for subscribing!';
        status.style.color = '#111';
    }

    function showError(message) {
        var status = getStatusEl();
        if (!status) return;
        status.textContent = message || 'Something went wrong. Please try again.';
        status.style.color = '#c0392b';
    }

    function clearStatus() {
        var status = getStatusEl();
        if (!status) return;
        status.textContent = '';
        status.style.color = '';
    }

    function ensureRecaptcha(done) {
        if (window.grecaptcha && typeof window.grecaptcha.execute === 'function') {
            done();
            return;
        }

        var waited = 0;
        var timer = setInterval(function () {
            waited += 100;
            if (window.grecaptcha && typeof window.grecaptcha.execute === 'function') {
                clearInterval(timer);
                done();
                return;
            }
            if (waited >= 10000) {
                clearInterval(timer);
                done(new Error('reCAPTCHA did not load'));
            }
        }, 100);
    }

    function fetchCaptchaToken(form) {
        return new Promise(function (resolve, reject) {
            var tokenEl = form.querySelector('.IDX-widgetRecaptchaToken');
            if (!tokenEl) {
                reject(new Error('Missing captcha field'));
                return;
            }

            ensureRecaptcha(function (err) {
                if (err) {
                    reject(err);
                    return;
                }

                window.grecaptcha.ready(function () {
                    window.grecaptcha
                        .execute(RECAPTCHA_SITE_KEY, { action: RECAPTCHA_ACTION })
                        .then(function (token) {
                            tokenEl.value = token;
                            resolve(token);
                        })
                        .catch(reject);
                });
            });
        });
    }

    function setSubmitBusy(form, busy) {
        var btn = form.querySelector('input[type="submit"]');
        if (!btn) return;
        btn.disabled = !!busy;
        btn.value = busy ? 'Sending…' : 'Subscribe';
    }

    function submitToIdx(email, recaptchaToken) {
        return fetch(SUBMIT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                recaptchaToken: recaptchaToken,
                widgetId: IDX_WIDGET_ID
            })
        }).then(function (res) {
            return res.json().catch(function () {
                return {};
            }).then(function (data) {
                return { ok: res.ok, data: data };
            });
        });
    }

    function handleFooterSubmit(form) {
        if (form.dataset.idxSubmitting === '1') return;
        form.dataset.idxSubmitting = '1';

        clearStatus();

        var emailInput = form.querySelector('input[name="email"]');
        var email = emailInput ? String(emailInput.value || '').trim() : '';

        if (!email) {
            showError('Please enter your email address.');
            form.dataset.idxSubmitting = '0';
            return;
        }

        var firstName = form.querySelector('input[name="firstName"]');
        var lastName = form.querySelector('input[name="lastName"]');
        if (firstName) firstName.value = 'Newsletter';
        if (lastName) lastName.value = 'Subscriber';

        setSubmitBusy(form, true);

        var tokenEl = form.querySelector('.IDX-widgetRecaptchaToken');
        var existingToken = tokenEl ? String(tokenEl.value || '').trim() : '';

        Promise.resolve(existingToken || fetchCaptchaToken(form))
            .then(function (token) {
                if (!token) {
                    return fetchCaptchaToken(form);
                }
                return token;
            })
            .then(function (token) {
                return submitToIdx(email, token);
            })
            .then(function (result) {
                if (result.ok && result.data && result.data.success) {
                    showThanks();
                    if (emailInput) emailInput.value = '';
                    return;
                }
                showError(
                    (result.data && (result.data.error || result.data.details)) ||
                        'Unable to subscribe right now. Please try again.'
                );
            })
            .catch(function () {
                showError('Unable to subscribe right now. Please try again.');
            })
            .finally(function () {
                form.dataset.idxSubmitting = '0';
                setSubmitBusy(form, false);
            });
    }

    function bindFooterSubmit(form) {
        if (form.dataset.idxSubscribeBound === '1') return;
        form.dataset.idxSubscribeBound = '1';

        form.id = 'idx-footer-lead-signup-form';

        var email = form.querySelector('input[name="email"]');
        if (email) {
            email.addEventListener('focus', function () {
                fetchCaptchaToken(form).catch(function () {});
            });
        }

        form.addEventListener(
            'submit',
            function (e) {
                e.preventDefault();
                e.stopPropagation();
                handleFooterSubmit(form);
            },
            true
        );
    }

    function customizeFooterIdx() {
        var root = getWidgetRoot();
        var signup = getSignupBlock(root);
        if (!signup) return false;

        var form = signup.querySelector('form');
        if (!form || form.dataset.idxSubscribeStyled === '1') return false;

        var email = form.querySelector('input[name="email"]');
        if (!email) return false;

        form.dataset.idxSubscribeStyled = '1';

        var firstName = form.querySelector('input[name="firstName"]');
        var lastName = form.querySelector('input[name="lastName"]');
        if (firstName) {
            firstName.value = 'Newsletter';
            firstName.type = 'hidden';
        }
        if (lastName) {
            lastName.value = 'Subscriber';
            lastName.type = 'hidden';
        }

        var phone = form.querySelector('input[name="phone"]');
        if (phone) {
            phone.type = 'hidden';
            phone.value = '';
        }

        signup.querySelectorAll('.IDX-widgetLabel').forEach(function (label) {
            var forId = label.getAttribute('for');
            var input = forId ? form.querySelector('#' + forId) : null;
            if (!input || input.type === 'hidden') {
                label.style.display = 'none';
            }
        });

        var header = signup.querySelector('#IDX-widgetLeadSignupHeaderWrapper');
        if (header) header.style.display = 'none';

        signup.style.cssText =
            'width:100%!important;padding:0!important;margin:0!important;border:none!important;box-shadow:none!important;-webkit-box-shadow:none!important;background:transparent!important;text-align:left!important;border-radius:0!important';

        email.setAttribute('placeholder', 'Your Email Address');
        email.removeAttribute('style');

        var submit = form.querySelector('input[type="submit"]');
        if (submit) {
            submit.value = 'Subscribe';
            submit.removeAttribute('style');
        }

        bindFooterSubmit(form);
        return true;
    }

    function watchWidget() {
        var root = getWidgetRoot();
        if (!root) return;

        if (customizeFooterIdx()) return;

        if (observer) return;

        observer = new MutationObserver(function () {
            if (customizeFooterIdx()) {
                observer.disconnect();
                observer = null;
            }
        });

        observer.observe(root, { childList: true, subtree: true });
    }

    function loadWidget() {
        var root = getWidgetRoot();
        if (!root || widgetLoaded) {
            watchWidget();
            return;
        }

        var ensure = window.ensureIdxBrokerJquery;
        if (!ensure) {
            console.error('[IDX] idx-broker-shim.js must load before subscribe-footer.js');
            return;
        }

        ensure(function () {
            if (widgetLoaded) return;
            if (root.querySelector('#idxwidgetsrc-42573')) {
                watchWidget();
                return;
            }

            widgetLoaded = true;

            var script = document.createElement('script');
            script.charset = 'UTF-8';
            script.type = 'text/javascript';
            script.id = 'idxwidgetsrc-42573';
            script.src = IDX_SRC;
            root.appendChild(script);
            watchWidget();
        });
    }

    function initIdxSubscribeFooter() {
        if (observer) {
            observer.disconnect();
            observer = null;
        }

        var root = getWidgetRoot();
        if (!root) return;

        if (root.querySelector('#idxwidgetsrc-42573')) {
            customizeFooterIdx();
            watchWidget();
            return;
        }

        loadWidget();
    }

    window.initIdxSubscribeFooter = initIdxSubscribeFooter;
    window.bootIdxSubscribeFooter = bootFooterWidget;

    function bootFooterWidget() {
        var root = getWidgetRoot();
        if (!root) {
            setTimeout(bootFooterWidget, 100);
            return;
        }

        var section = root.closest('.s-footer__subscribe') || root;
        if (!('IntersectionObserver' in window)) {
            initIdxSubscribeFooter();
            return;
        }

        var seen = false;
        var io = new IntersectionObserver(
            function (entries) {
                if (seen) return;
                if (!entries.some(function (e) { return e.isIntersecting; })) return;
                seen = true;
                io.disconnect();
                initIdxSubscribeFooter();
            },
            { rootMargin: '120px' }
        );
        io.observe(section);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootFooterWidget);
    } else {
        bootFooterWidget();
    }
})();
