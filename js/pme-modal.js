/**
 * Private Market Evaluation modal — site-wide
 * IDX lead signup widget 42572, loaded inline when the modal opens.
 */
(function () {
    'use strict';

    var IDX_WIDGET_SRC =
        'https://keplersiguineau.idxbroker.com/idx/leadsignupwidget.php?widgetid=42572';
    var IDX_WIDGET_ID = 42572;
    var RECAPTCHA_SITE_KEY = '6LcUhOYUAAAAAF694SR5_qDv-ZdRHv77I6ZmSiij';
    var RECAPTCHA_ACTION = 'widgetRegistration';
    var SUBMIT_URL = '/.netlify/functions/idx-pme';

    var MODAL_HTML =
        '<div id="pmeModal" class="pme-modal" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="pmeModalTitle">' +
        '<div class="pme-modal__backdrop" data-pme-close></div>' +
        '<div class="pme-modal__box">' +
        '<button type="button" class="pme-modal__close" aria-label="Close" data-pme-close>&times;</button>' +
        '<p class="pme-modal__eyebrow">Exclusive Service</p>' +
        '<h2 class="pme-modal__title" id="pmeModalTitle">The Luxury Market Is Always Changing</h2>' +
        '<div class="pme-modal__bar"></div>' +
        '<p class="pme-modal__body">Do you want a professional private market valuation from Naples\' most trusted luxury real estate team? Share your details below and we\'ll be in touch.</p>' +
        '<div class="pme-modal__widget" id="pmeIdxWidget">' +
        '<p class="pme-modal__loading">Loading form…</p>' +
        '</div>' +
        '<div class="pme-modal__status" id="pme-modal-status" aria-live="polite"></div>' +
        '</div></div>';

    var idxObserver = null;
    var widgetLoading = false;

    function getContainer() {
        return document.getElementById('pmeIdxWidget');
    }

    function getStatusEl() {
        return document.getElementById('pme-modal-status');
    }

    function hideLoading() {
        var el = document.querySelector('#pmeIdxWidget > .pme-modal__loading');
        if (el) el.remove();
    }

    function clearStatus() {
        var status = getStatusEl();
        if (!status) return;
        status.textContent = '';
        status.style.color = '';
    }

    function showError(message) {
        var status = getStatusEl();
        if (!status) return;
        status.textContent = message || 'Something went wrong. Please try again.';
        status.style.color = '#c0392b';
    }

    function resetAfterSubmit() {
        var container = getContainer();
        if (!container || !container.querySelector('.pme-modal__thanks')) return;

        container.innerHTML = '<p class="pme-modal__loading">Loading form…</p>';
        widgetLoading = false;
        clearStatus();

        if (idxObserver) {
            idxObserver.disconnect();
            idxObserver = null;
        }
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
        btn.value = busy ? 'Sending…' : 'Request My Evaluation';
    }

    function submitToIdx(payload) {
        return fetch(SUBMIT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(function (res) {
            return res.json().catch(function () {
                return {};
            }).then(function (data) {
                return { ok: res.ok, data: data };
            });
        });
    }

    function customizeForm() {
        var container = getContainer();
        if (!container) return false;

        var signup = container.querySelector('.LeadSignup');
        if (!signup) return false;

        var form = signup.querySelector('form');
        if (!form || form.dataset.pmeStyled === '1') return false;

        var firstName = form.querySelector('input[name="firstName"]');
        if (!firstName) return false;

        form.dataset.pmeStyled = '1';
        form.id = 'idx-pme-lead-signup-form';
        hideLoading();

        var placeholders = {
            firstName: 'First Name',
            lastName: 'Last Name',
            email: 'Email Address',
            phone: 'Phone Number'
        };

        Object.keys(placeholders).forEach(function (name) {
            var input = form.querySelector('input[name="' + name + '"]');
            if (input) input.setAttribute('placeholder', placeholders[name]);
        });

        var submit = form.querySelector('input[type="submit"]');
        if (submit) submit.value = 'Request My Evaluation';

        var header = signup.querySelector('#IDX-widgetLeadSignupHeaderWrapper');
        if (header) header.style.display = 'none';

        signup.style.cssText =
            'width:100%!important;padding:0!important;margin:0!important;border:none!important;' +
            'box-shadow:none!important;background:transparent!important';

        bindSubmit(form);
        return true;
    }

    function showThanks() {
        var container = getContainer();
        if (!container) return;

        container.innerHTML =
            '<p class="pme-modal__thanks">Thank you! We\'ll be in touch shortly.</p>';
    }

    function handlePmeSubmit(form) {
        if (form.dataset.pmeSubmitting === '1') return;
        form.dataset.pmeSubmitting = '1';
        clearStatus();

        var firstName = cleanInput(form, 'firstName');
        var lastName = cleanInput(form, 'lastName');
        var email = cleanInput(form, 'email');
        var phone = cleanInput(form, 'phone');

        if (!firstName || !lastName) {
            showError('Please enter your first and last name.');
            form.dataset.pmeSubmitting = '0';
            return;
        }

        if (!email) {
            showError('Please enter your email address.');
            form.dataset.pmeSubmitting = '0';
            return;
        }

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
                return submitToIdx({
                    widgetId: IDX_WIDGET_ID,
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    phone: phone,
                    recaptchaToken: token
                });
            })
            .then(function (result) {
                if (result.ok && result.data && result.data.success) {
                    showThanks();
                    return;
                }
                showError(
                    (result.data && (result.data.error || result.data.details)) ||
                        'Unable to submit right now. Please try again.'
                );
                setSubmitBusy(form, false);
            })
            .catch(function () {
                showError('Unable to submit right now. Please try again.');
                setSubmitBusy(form, false);
            })
            .finally(function () {
                form.dataset.pmeSubmitting = '0';
            });
    }

    function cleanInput(form, name) {
        var input = form.querySelector('input[name="' + name + '"]');
        return input ? String(input.value || '').trim() : '';
    }

    function bindSubmit(form) {
        if (form.dataset.pmeSubmitBound === '1') return;
        form.dataset.pmeSubmitBound = '1';

        form.querySelectorAll('input:not([type="hidden"])').forEach(function (input) {
            input.addEventListener('focus', function () {
                fetchCaptchaToken(form).catch(function () {});
            });
        });

        form.addEventListener(
            'submit',
            function (e) {
                e.preventDefault();
                e.stopPropagation();
                handlePmeSubmit(form);
            },
            true
        );
    }

    function watchWidget() {
        var container = getContainer();
        if (!container) return;

        if (customizeForm()) return;

        if (idxObserver) return;

        idxObserver = new MutationObserver(function () {
            if (customizeForm()) {
                idxObserver.disconnect();
                idxObserver = null;
            }
        });

        idxObserver.observe(container, { childList: true, subtree: true });
    }

    function loadWidget() {
        var container = getContainer();
        if (!container || widgetLoading) return;

        if (container.querySelector('.LeadSignup form')) {
            watchWidget();
            return;
        }

        if (container.querySelector('#idxwidgetsrc-42572')) {
            watchWidget();
            return;
        }

        var ensure = window.ensureIdxBrokerJquery;
        if (!ensure) {
            hideLoading();
            container.insertAdjacentHTML(
                'beforeend',
                '<p class="pme-modal__error">Form could not load. Please refresh and try again.</p>'
            );
            return;
        }

        widgetLoading = true;

        ensure(function () {
            widgetLoading = false;
            if (container.querySelector('#idxwidgetsrc-42572')) {
                watchWidget();
                return;
            }

            var script = document.createElement('script');
            script.charset = 'UTF-8';
            script.type = 'text/javascript';
            script.id = 'idxwidgetsrc-42572';
            script.src = IDX_WIDGET_SRC;
            container.appendChild(script);
            watchWidget();
        });
    }

    function isPmeLink(el) {
        if (!el || el.tagName !== 'A') return false;
        if (el.classList.contains('js-pme-modal')) return true;
        return (el.getAttribute('href') || '').trim() === '#pme-request';
    }

    function ensureModal() {
        var modal = document.getElementById('pmeModal');
        if (modal) return modal;
        document.body.insertAdjacentHTML('beforeend', MODAL_HTML);
        return document.getElementById('pmeModal');
    }

    function openModal() {
        var modal = ensureModal();
        if (!modal) return;

        resetAfterSubmit();
        loadWidget();
        watchWidget();
        clearStatus();

        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        var closeBtn = modal.querySelector('.pme-modal__close');
        if (closeBtn) {
            setTimeout(function () { closeBtn.focus(); }, 50);
        }
    }

    function closeModal() {
        var modal = document.getElementById('pmeModal');
        if (!modal) return;
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    function bindModal(modal) {
        if (!modal || modal.dataset.pmeBound === '1') return;
        modal.dataset.pmeBound = '1';
        modal.querySelectorAll('[data-pme-close], .pme-modal__backdrop, .pme-modal__close').forEach(function (el) {
            el.addEventListener('click', closeModal);
        });
    }

    function init() {
        bindModal(ensureModal());

        document.addEventListener('click', function (e) {
            var link = e.target.closest('a');
            if (!isPmeLink(link)) return;
            e.preventDefault();
            e.stopPropagation();
            openModal();
        }, true);

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeModal();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
