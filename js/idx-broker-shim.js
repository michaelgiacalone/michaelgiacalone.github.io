/**
 * IDX widgets use //middleware.idxbroker.com for jQuery, which breaks on
 * http://localhost (404). Load jQuery over HTTPS before any IDX widget scripts.
 */
(function () {
    'use strict';

    var JQ_SRC =
        'https://middleware.idxbroker.com/graphical/javascript/jqwidx.js';

    window.ensureIdxBrokerJquery = function (ready) {
        if (typeof ready !== 'function') return;

        if (window.idx && window.idx.fn) {
            ready();
            return;
        }

        window.idx = window.idx || {};

        function whenReady() {
            var attempts = 0;
            (function tick() {
                if (window.idx && window.idx.fn) {
                    ready();
                    return;
                }
                attempts += 1;
                if (attempts > 120) {
                    console.error('[IDX] jQuery shim timed out loading jqwidx.js');
                    ready();
                    return;
                }
                setTimeout(tick, 50);
            })();
        }

        var tag = document.getElementById('idx_jquery_include_tag');
        if (!tag) {
            tag = document.createElement('script');
            tag.id = 'idx_jquery_include_tag';
            tag.src = JQ_SRC;
            tag.onload = whenReady;
            tag.onerror = function () {
                console.error('[IDX] Failed to load jqwidx.js from', JQ_SRC);
                ready();
            };
            (document.head || document.documentElement).appendChild(tag);
            return;
        }

        if (window.idx && window.idx.fn) {
            ready();
        } else {
            tag.addEventListener('load', whenReady);
            whenReady();
        }
    };
})();
