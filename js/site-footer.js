/**
 * Site footer — ref: assets/bottom_nav.png
 * Subscribe band (regular) + Premier bar + legal block.
 */
(function () {
    'use strict';

    var LOGO =
        'https://cdn-cws.datafloat.com/PSB/images/company/PSB/logo-white.png';

    var DISCLAIMER =
        'Sotheby\'s International Realty&reg; and the Sotheby\'s International Realty Logo are service marks licensed to Sotheby\'s International Realty Affiliates LLC and used with permission. ' +
        'Premier Sotheby\'s International Realty fully supports the principles of the Fair Housing Act and the Equal Opportunity Act. ' +
        'Each franchise is independently owned and operated. Any services or products provided by independently owned and operated franchisees are not provided by, affiliated with or related to Sotheby\'s International Realty Affiliates LLC nor any of its affiliated companies.';

    var INSIGHT_CONTACT =
        'Michael can be easily reached at <a href="tel:+12394310321">239.431.0321</a>. Backed by the global reach of Sotheby\'s International Realty, Michael offers world-class marketing, powerful international exposure, and an elevated level of service built on trust, communication, and concierge-level attention.';

    function isInsightArticle() {
        return /\/Insights\//i.test(window.location.pathname);
    }

    function buildFooterHtml() {
        var insightContactHtml = isInsightArticle()
            ? '<div class="s-footer__insight-contact"><p>' + INSIGHT_CONTACT + '</p></div>'
            : '';

        return (
            '<div class="row s-footer__subscribe">' +
            '<div class="column lg-12">' +
            '<h2>Looking to buy or sell?</h2>' +
            '<p>Let us know how we can help you.</p>' +
            '<form id="mc-form" class="mc-form">' +
            '<input type="email" name="EMAIL" id="mce-EMAIL" class="u-fullwidth text-center" placeholder="Your Email Address" required>' +
            '<input type="submit" name="subscribe" value="Subscribe" class="btn--small btn--primary u-fullwidth">' +
            '<div class="mc-status"></div>' +
            '</form>' +
            '</div>' +
            '</div>' +
            '<div class="s-footer__premier-bar">' +
            '<div class="s-footer__premier-inner">' +
            '<div class="s-footer__premier-logo">' +
            '<img src="' +
            LOGO +
            '" alt="Premier Sotheby\'s International Realty">' +
            '</div>' +
            '<div class="s-footer__premier-col">' +
            '<p class="s-footer__premier-label">Home Office</p>' +
            '<p class="s-footer__premier-text">Broad Avenue Office<br>390 Broad Avenue South<br>Naples, FL 34102</p>' +
            '</div>' +
            '<div class="s-footer__premier-col">' +
            '<p class="s-footer__premier-label">Call Me Directly</p>' +
            '<p class="s-footer__premier-text"><a href="tel:+12394310321">239.431.0321</a></p>' +
            '</div>' +
            '</div>' +
            '</div>' +
            insightContactHtml +
            '<div class="s-footer__legal">' +
            '<p class="s-footer__copyright">&copy; ' +
            new Date().getFullYear() +
            ' Premier Sotheby\'s International Realty. All Rights Reserved.</p>' +
            '<p class="s-footer__disclaimer">' +
            DISCLAIMER +
            '</p>' +
            '</div>'
        );
    }

    function applyPremierFooter() {
        var footer = document.getElementById('colophon');
        if (!footer) return;
        footer.className = 's-footer s-footer--premier';
        footer.setAttribute('data-premier-footer', '3');
        footer.innerHTML = buildFooterHtml();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyPremierFooter);
    } else {
        applyPremierFooter();
    }
})();
