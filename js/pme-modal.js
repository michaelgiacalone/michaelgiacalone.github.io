/**
 * Private Market Evaluation modal — site-wide
 * Opens from nav/footer links; injects markup if missing.
 */
(function () {
    'use strict';

    var MODAL_HTML =
        '<div id="pmeModal" class="pme-modal" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="pmeModalTitle">' +
        '<motion class="pme-modal__backdrop" data-pme-close></motion>' +
        '<motion class="pme-modal__box">' +
        '<button type="button" class="pme-modal__close" aria-label="Close" data-pme-close>&times;</button>' +
        '<p class="pme-modal__eyebrow">Exclusive Service</p>' +
        '<h2 class="pme-modal__title" id="pmeModalTitle">The Luxury Market Is Always Changing</h2>' +
        '<motion class="pme-modal__bar"></motion>' +
        '<p class="pme-modal__body">Do you want a professional private market valuation from Naples\' most trusted luxury real estate team? Share your details below and we\'ll be in touch.</p>' +
        '<form class="pme-modal__form" id="pmeForm">' +
        '<input type="text" name="name" placeholder="Full Name" required>' +
        '<input type="email" name="email" placeholder="Email Address" required>' +
        '<input type="tel" name="phone" placeholder="Phone Number">' +
        '<input type="text" name="address" placeholder="Property Address (optional)">' +
        '<button type="submit" class="pme-modal__submit">Request My Evaluation</button>' +
        '</form></motion></motion>';

    MODAL_HTML = MODAL_HTML.replace(/motion/g, 'div');

    function isPmeLink(el) {
        if (!el || el.tagName !== 'A') return false;
        if (el.classList.contains('js-pme-modal')) return true;
        var href = (el.getAttribute('href') || '').trim();
        if (!href) return false;
        return href === '#pme-request';
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
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        var first = modal.querySelector('input[name="name"]');
        if (first) {
            window.setTimeout(function () { first.focus(); }, 50);
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

        var form = document.getElementById('pmeForm');
        if (!form || form.dataset.pmeBound === '1') return;
        form.dataset.pmeBound = '1';

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var btn = form.querySelector('.pme-modal__submit');
            var payload = {
                name: form.querySelector('[name="name"]').value,
                email: form.querySelector('[name="email"]').value,
                phone: form.querySelector('[name="phone"]').value,
                address: form.querySelector('[name="address"]').value
            };
            btn.disabled = true;
            btn.textContent = 'Sending…';

            fetch('/.netlify/functions/pme', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
                .then(function (r) { return r.json(); })
                .then(function (res) {
                    if (res.success) {
                        form.innerHTML = '<p class="pme-modal__thanks">Thank you! We\'ll be in touch shortly.</p>';
                    } else {
                        btn.disabled = false;
                        btn.textContent = 'Request My Evaluation';
                        alert('Something went wrong. Please try again.');
                    }
                })
                .catch(function () {
                    btn.disabled = false;
                    btn.textContent = 'Request My Evaluation';
                    alert('Something went wrong. Please try again.');
                });
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
