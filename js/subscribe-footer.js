/**
 * Footer email opt-in — IDX lead signup widget (42573)
 * Cooperates with IDX's native validation + reCAPTCHA; posts via hidden iframe.
 */
(function () {
    'use strict';

    var IDX_SIGNUP_URL =
        'https://keplersiguineau.idxbroker.com/idx/ajax/usersignup.php';
    var IDX_SRC =
        'https://keplersiguineau.idxbroker.com/idx/leadsignupwidget.php?widgetid=42573';

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

    function setSubmitBusy(form, busy) {
        var btn = form.querySelector('input[type="submit"]');
        if (!btn) return;
        btn.disabled = !!busy;
        btn.value = busy ? 'Sending…' : 'Subscribe';
    }

    function prepareFormForIdx(form) {
        var firstName = form.querySelector('input[name="firstName"]');
        var lastName = form.querySelector('input[name="lastName"]');
        if (firstName) firstName.value = 'Newsletter';
        if (lastName) lastName.value = 'Subscriber';

        form.setAttribute('action', IDX_SIGNUP_URL);
        form.setAttribute('method', 'post');
        form.setAttribute('target', 'idxSubscribeFrame');
    }

    function setupIframeSubmit(form, root) {
        if (form.dataset.idxSubscribeBound === '1') return;
        form.dataset.idxSubscribeBound = '1';

        var iframe = document.getElementById('idxSubscribeFrame');
        if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.id = 'idxSubscribeFrame';
            iframe.name = 'idxSubscribeFrame';
            iframe.title = 'Newsletter signup submission';
            iframe.setAttribute('tabindex', '-1');
            iframe.setAttribute('aria-hidden', 'true');
            iframe.style.cssText =
                'position:absolute;width:0;height:0;border:0;opacity:0;pointer-events:none';
            root.appendChild(iframe);
        }

        var pendingSubmit = false;

        iframe.addEventListener('load', function () {
            if (!pendingSubmit) return;
            pendingSubmit = false;
            showThanks();
            var email = form.querySelector('input[name="email"]');
            if (email) email.value = '';
            setSubmitBusy(form, false);
        });

        form.addEventListener('submit', function (e) {
            if (e.defaultPrevented) return;

            clearStatus();

            var emailInput = form.querySelector('input[name="email"]');
            var emailVal = emailInput ? String(emailInput.value || '').trim() : '';
            if (!emailVal) {
                e.preventDefault();
                showError('Please enter your email address.');
                return;
            }

            var tokenEl = form.querySelector('.IDX-widgetRecaptchaToken');
            if (!tokenEl || !String(tokenEl.value || '').trim()) {
                e.preventDefault();
                showError('Please click the email field, then try again.');
                return;
            }

            prepareFormForIdx(form);
            pendingSubmit = true;
            setSubmitBusy(form, true);
        });
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

        setupIframeSubmit(form, root);
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

        initIdxSubscribeFooter();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootFooterWidget);
    } else {
        bootFooterWidget();
    }
})();
