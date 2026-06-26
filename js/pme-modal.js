/**
 * Private Market Evaluation modal — site-wide
 * Loads IDX widget 42572 in an isolated iframe (avoids duplicate form IDs with footer widget).
 */
(function () {
    'use strict';

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
        '<iframe id="pmeIdxEmbed" class="pme-modal__embed" title="Private market evaluation form" src="about:blank"></iframe>' +
        '</div>' +
        '</div></div>';

    function getEmbedSrc() {
        var path = window.location.pathname || '';
        if (path.indexOf('/communities/') !== -1 || path.indexOf('/Insights/') !== -1) {
            return '../pme-embed.html';
        }
        return 'pme-embed.html';
    }

    function getEmbedFrame() {
        return document.getElementById('pmeIdxEmbed');
    }

    function showThanksInModal() {
        var widget = document.getElementById('pmeIdxWidget');
        if (!widget) return;
        widget.innerHTML =
            '<p class="pme-modal__thanks">Thank you! We\'ll be in touch shortly.</p>';
    }

    function resetEmbed() {
        var widget = document.getElementById('pmeIdxWidget');
        if (!widget) return;
        widget.innerHTML =
            '<iframe id="pmeIdxEmbed" class="pme-modal__embed" title="Private market evaluation form" src="about:blank"></iframe>';
    }

    function loadEmbed() {
        var frame = getEmbedFrame();
        if (!frame) return;
        var src = getEmbedSrc();
        if (frame.getAttribute('data-loaded-src') !== src) {
            frame.src = src;
            frame.setAttribute('data-loaded-src', src);
        }
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

        resetEmbed();
        loadEmbed();

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

        window.addEventListener('message', function (e) {
            if (!e.data) return;

            if (e.data.type === 'pme-embed-height') {
                var frame = getEmbedFrame();
                if (frame && e.data.height) {
                    frame.style.height = Math.max(120, e.data.height) + 'px';
                }
                return;
            }

            if (e.data.type === 'pme-lead-thanks') {
                showThanksInModal();
            }
        });

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
