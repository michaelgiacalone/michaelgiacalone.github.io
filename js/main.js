/* ===================================================================
 * Spurgeon 1.0.0 - Main JS
 *
 * ------------------------------------------------------------------- */

/* Static servers (e.g. python -m http.server) cannot run Netlify Functions and
 * return 501 for POST to /.netlify/functions/*. Fake a success JSON so forms
 * do not throw; use `netlify dev` or deploy for real submissions. */
(function () {
    var origFetch = window.fetch;
    if (!origFetch) return;
    function fnPath(u) {
        if (typeof u === 'string') return u;
        if (u && typeof u.url === 'string') return u.url;
        return '';
    }
    window.fetch = function (url, init) {
        return origFetch.apply(this, arguments).then(function (res) {
            var path = fnPath(url);
            if (path.indexOf('/.netlify/functions/') !== 0 || res.ok) return res;
            if (res.status === 501 || res.status === 404 || res.status === 405) {
                if (typeof console !== 'undefined' && console.info) {
                    console.info('[forms] Netlify function unavailable (local static server). Use netlify dev or deploy for live POST.');
                }
                return {
                    ok: true,
                    status: 200,
                    json: function () {
                        return Promise.resolve({ success: true, localPreview: true });
                    }
                };
            }
            return res;
        });
    };
})();

(function(html) {

    'use strict';


   /* preloader
    * -------------------------------------------------- */
    const ssPreloader = function() {

        const siteBody = document.querySelector('body');
        const preloader = document.querySelector('#preloader');
        if (!preloader) return;

        html.classList.add('ss-preload');
        
        window.addEventListener('load', function() {
            html.classList.remove('ss-preload');
            html.classList.add('ss-loaded');

            preloader.addEventListener('transitionend', function afterTransition(e) {
                if (e.target.matches('#preloader'))  {
                    // siteBody.classList.add('ss-show');
                    e.target.style.display = 'none';
                    preloader.removeEventListener(e.type, afterTransition);
                }
            });
        });

    }; // end ssPreloader


   /* mobile menu
    * ---------------------------------------------------- */ 
    const ssMobileMenu = function() {

        const toggleButton = document.querySelector('.s-header__menu-toggle');
        const mainNavWrap = document.querySelector('.s-header__nav-wrap');
        const mainNav = document.querySelector('.s-header__nav');
        const parentMenus = mainNav.querySelectorAll('.has-children');
        const siteBody = document.querySelector('body');

        if (!(toggleButton && mainNavWrap)) return;

        toggleButton.addEventListener('click', function(e) {
            e.preventDefault();
            toggleButton.classList.toggle('is-clicked');
            siteBody.classList.toggle('menu-is-open');

            scrollLock.getScrollState() ? scrollLock.disablePageScroll(mainNavWrap) : scrollLock.enablePageScroll(mainNavWrap);
        });

        // open (or close) submenu items in mobile view menu. 
        // close all the other open submenu items.
        mainNav.addEventListener('click', function(e) {

            //check if the right element clicked
            if (!e.target.closest('.has-children')) return;
            else {

                //check if element contains active class
                if (!e.target.closest('.has-children').classList.contains('sub-menu-is-open')) {

                    parentMenus.forEach(function(current) {
                        current.classList.remove('sub-menu-is-open');
                    });

                    // add is-active class on cliked accordion
                    e.target.closest('.has-children').classList.add('sub-menu-is-open');

                } else {

                    // remove is-active class on cliked accordion
                    e.target.closest('.has-children').classList.remove('sub-menu-is-open');
                }
            }
        });

        window.addEventListener('resize', function() {

            // above 1200px
            if (window.matchMedia('(min-width: 1201px)').matches) {
                if (siteBody.classList.contains('menu-is-open')) siteBody.classList.remove('menu-is-open');
                if (toggleButton.classList.contains('is-clicked')) toggleButton.classList.remove('is-clicked');
                if (!scrollLock.getScrollState()) scrollLock.enablePageScroll();

                parentMenus.forEach(function(current) {
                    current.classList.remove('sub-menu-is-open');
                });
            }
        });

    }; // end ssMobileMenu


    /* search
    * ------------------------------------------------------ */
    const ssSearch = function() {

        const searchWrap = document.querySelector('.s-header__search');
        const searchTrigger = document.querySelector('.s-header__search-trigger');

        if (!(searchWrap && searchTrigger)) return;

        const searchField = searchWrap.querySelector('.s-header__search-field');
        const closeSearch = searchWrap.querySelector('.s-header__search-close');
        const siteBody = document.querySelector('body');

        searchTrigger.addEventListener('click', function(e) {

            e.preventDefault();
            e.stopPropagation();
            siteBody.classList.add('search-is-visible');

            scrollLock.getScrollState() ? scrollLock.disablePageScroll(searchWrap) : scrollLock.enablePageScroll(searchWrap);

            setTimeout(function(){
                searchWrap.querySelector('.s-header__search-field').focus();
            }, 100);
        });

        closeSearch.addEventListener('click', function(e) {

            e.stopPropagation();

            if(siteBody.classList.contains('search-is-visible')) {

                siteBody.classList.remove('search-is-visible');
                setTimeout(function(){
                    searchWrap.querySelector('.s-header__search-field').blur();
                }, 100);

                scrollLock.getScrollState() ? scrollLock.disablePageScroll(searchWrap) : scrollLock.enablePageScroll(searchWrap);
            }
        });

        searchWrap.addEventListener('click', function(e) {
            if( !(e.target.matches('.s-header__search-inner')) ) {
                closeSearch.dispatchEvent(new Event('click'));
            }
        });

        searchField.addEventListener('click', function(e) {
            e.stopPropagation();
        })

        searchField.setAttribute('placeholder', 'Search for...');
        searchField.setAttribute('autocomplete', 'off');

    }; // end ssSearch


    /* masonry
    * ------------------------------------------------------ */
    const ssMasonry = function() {

        const containerBricks = document.querySelector('.bricks-wrapper');
        if (!containerBricks) return;

        imagesLoaded(containerBricks, function() {

            const msnry = new Masonry(containerBricks, {
                itemSelector: '.entry:not(.is-hidden)',
                columnWidth: '.grid-sizer',
                percentPosition: true,
                resize: true
            });

            containerBricks._msnry = msnry;

        });

    }; // end ssMasonry


   /* blog list from blogs/manifest.json (home page only)
    * Replaces static entries when manifest loads; on failure keeps static content and still runs pagination/masonry.
    * ------------------------------------------------------ */
    const ssBlogList = function() {

        const pageWrap = document.querySelector('.s-pagewrap');
        const bricks = document.querySelector('.bricks');
        const wrapper = document.querySelector('.bricks-wrapper');
        if (!(pageWrap && pageWrap.classList.contains('ss-home') && bricks && wrapper)) return;

        function escapeHtml(s) {
            if (!s) return '';
            var div = document.createElement('div');
            div.textContent = s;
            return div.innerHTML;
        }

        function replaceWithManifest(posts) {
            wrapper.querySelectorAll('.entry').forEach(function(el) { el.remove(); });
            posts.forEach(function(post) {
                var href = 'blogs/' + (post.file || '');
                var img = post.image || 'images/thumbs/masonry/statue-600.jpg';
                var img2x = post.image2x || post.image || 'images/thumbs/masonry/statue-1200.jpg';
                var title = post.title || 'Untitled';
                var excerpt = post.excerpt || '';
                var category = post.category || 'Uncategorized';
                var author = post.author || 'Spurgeon';
                var article = document.createElement('article');
                article.className = 'brick entry';
                article.setAttribute('data-animate-el', '');
                article.innerHTML =
                    '<div class="entry__thumb">' +
                    '<a href="' + href + '" class="thumb-link">' +
                    '<img src="' + img + '" srcset="' + img + ' 1x, ' + img2x + ' 2x" alt="">' +
                    '</a></div>' +
                    '<div class="entry__text">' +
                    '<div class="entry__header">' +
                    '<div class="entry__meta">' +
                    '<span class="cat-links"><a href="category.html">' + escapeHtml(category) + '</a></span>' +
                    '<span class="byline">By: <a href="#0">' + escapeHtml(author) + '</a></span>' +
                    '</div>' +
                    '<h1 class="entry__title"><a href="' + href + '">' + escapeHtml(title) + '</a></h1>' +
                    '</div>' +
                    '<div class="entry__excerpt"><p>' + escapeHtml(excerpt) + '</p></div>' +
                    '<a class="entry__more-link" href="' + href + '">Read More</a>' +
                    '</div>';
                wrapper.appendChild(article);
            });
        }

        function initBricks() {
            ssPagination();
            ssMasonry();
        }

        fetch('blogs/manifest.json')
            .then(function(r) { return r.ok ? r.json() : Promise.reject(new Error('Not ok')); })
            .then(function(data) {
                var posts = (data && data.posts) ? data.posts : [];
                if (posts.length > 0) replaceWithManifest(posts);
                initBricks();
            })
            .catch(function() {
                initBricks();
            });
    }; // end ssBlogList


   /* pagination (bricks)
    * ------------------------------------------------------ */
    const ssPagination = function() {

        const bricks = document.querySelector('.bricks');
        const wrapper = document.querySelector('.bricks-wrapper');
        const pgnNav = bricks && bricks.querySelector('.pgn');
        const entries = wrapper ? wrapper.querySelectorAll('.entry') : [];

        if (!(bricks && pgnNav && entries.length)) return;

        const perPage = 6;
        const totalPages = Math.ceil(entries.length / perPage);
        let currentPage = 1;
        const pgnList = pgnNav.querySelector('ul');

        function showPage(page) {
            currentPage = Math.max(1, Math.min(page, totalPages));
            const start = (currentPage - 1) * perPage;
            const end = start + perPage;

            entries.forEach(function(el, i) {
                el.classList.toggle('is-hidden', i < start || i >= end);
            });

            renderNav();
            if (wrapper._msnry) {
                if (typeof wrapper._msnry.reloadItems === 'function') wrapper._msnry.reloadItems();
                wrapper._msnry.layout();
            }

            if (currentPage > 1) {
                const bricksEl = document.getElementById('bricks');
                if (bricksEl) bricksEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }

        function pageNumbers() {
            var pages = [];
            var showEllipsisStart = false;
            var showEllipsisEnd = false;
            if (totalPages <= 7) {
                for (var i = 1; i <= totalPages; i++) pages.push(i);
            } else {
                showEllipsisStart = currentPage > 3;
                showEllipsisEnd = currentPage < totalPages - 2;
                if (showEllipsisStart) pages.push(1);
                if (showEllipsisStart) pages.push('…');
                for (var j = Math.max(1, currentPage - 1); j <= Math.min(totalPages, currentPage + 1); j++) {
                    if (pages.indexOf(j) === -1) pages.push(j);
                }
                if (showEllipsisEnd) pages.push('…');
                if (showEllipsisEnd) pages.push(totalPages);
            }
            return pages;
        }

        function renderNav() {
            // Hide pagination only when everything fits on one page (6 or fewer posts)
            if (totalPages <= 1) {
                pgnNav.style.display = 'none';
                return;
            }
            pgnNav.style.display = '';

            var prevSvg = '<svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.25 6.75L4.75 12L10.25 17.25"></path><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.25 12H5"></path></svg>';
            var nextSvg = '<svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.75 6.75L19.25 12L13.75 17.25"></path><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 12H4.75"></path></svg>';

            var html = '<li><a class="pgn__prev' + (currentPage === 1 ? ' inactive' : '') + '" href="#0">' + prevSvg + '</a></li>';
            var nums = pageNumbers();
            for (var n = 0; n < nums.length; n++) {
                if (nums[n] === '…') {
                    html += '<li><span class="pgn__num dots">…</span></li>';
                } else {
                    var isCurrent = nums[n] === currentPage;
                    html += '<li>' + (isCurrent ? '<span class="pgn__num current">' + nums[n] + '</span>' : '<a class="pgn__num" href="#0" data-page="' + nums[n] + '">' + nums[n] + '</a>') + '</li>';
                }
            }
            html += '<li><a class="pgn__next' + (currentPage === totalPages ? ' inactive' : '') + '" href="#0">' + nextSvg + '</a></li>';

            pgnList.innerHTML = html;
        }

        pgnNav.addEventListener('click', function(e) {
            e.preventDefault();
            var prev = e.target.closest('.pgn__prev');
            var next = e.target.closest('.pgn__next');
            var num = e.target.closest('.pgn__num[data-page]');
            if (prev && !prev.classList.contains('inactive')) showPage(currentPage - 1);
            else if (next && !next.classList.contains('inactive')) showPage(currentPage + 1);
            else if (num) showPage(parseInt(num.getAttribute('data-page'), 10));
        });

        showPage(1);
    }; // end ssPagination


   /* animate masonry elements if in viewport
    * ------------------------------------------------------ */
    const ssAnimateBricks = function() {

        const animateBlocks = document.querySelectorAll('[data-animate-block]');
        const pageWrap = document.querySelector('.s-pagewrap');
        if (!(pageWrap && animateBlocks)) return;

        // on homepage do animate on scroll
        if (pageWrap.classList.contains('ss-home')) {
            window.addEventListener('scroll', animateOnScroll);
        }
        // animate on load
        else {
            window.addEventListener('load', function(){
                doAnimate(animateBlocks[0]);
            });
        }

        // do animate
        function doAnimate(current) {
            const els = current.querySelectorAll('[data-animate-el]');
            const p = new Promise(function(resolve, reject) {

                els.forEach(function(el, index, array) {
                    const dly = index * 200;

                    el.style.setProperty('--transition-delay', dly + 'ms');
                    if (index === array.length -1) resolve();
                });

            });
            
            p.then(function() {
                current.classList.add('ss-animated');
            });
        }

        // animate on scroll 
        function animateOnScroll() {

            let scrollY = window.pageYOffset;

            animateBlocks.forEach(function(current) {

                const viewportHeight = window.innerHeight;
                const triggerTop = (current.offsetTop + (viewportHeight * .1)) - viewportHeight;
                const blockHeight = current.offsetHeight;
                const blockSpace = triggerTop + blockHeight;
                const inView = scrollY > triggerTop && scrollY <= blockSpace;
                const isAnimated = current.classList.contains('ss-animated');

                if (inView && (!isAnimated)) {
                    doAnimate(current);
                }

            });
        }

    }; // end ssAnimateOnScroll


   /* swiper
    * ------------------------------------------------------ */ 
    const ssSwiper = function() {

        const mySwiper = new Swiper('.swiper-container', {

            slidesPerView: 1,
            effect: 'fade',
            speed: 1000,
            pagination: {
                el: '.swiper-pagination',
                clickable: true, 
                renderBullet: function (index, className) {
                    return '<span class="' + className + '">' + (index + 1) + '</span>';
                }
            }

        });

    }; // end ssSwiper


   /* alert boxes
    * ------------------------------------------------------ */
    const ssAlertBoxes = function() {

        const boxes = document.querySelectorAll('.alert-box');
  
        boxes.forEach(function(box){

            box.addEventListener('click', function(event) {
                if (event.target.matches('.alert-box__close')) {
                    event.stopPropagation();
                    event.target.parentElement.classList.add('hideit');

                    setTimeout(function(){
                        box.style.display = 'none';
                    }, 500)
                }
            });
        })

    }; // end ssAlertBoxes


    /* Back to Top
    * ------------------------------------------------------ */
    const ssBackToTop = function() {

        const pxShow = 900;
        const goTopButton = document.querySelector(".ss-go-top");

        if (!goTopButton) return;

        // Show or hide the button
        if (window.scrollY >= pxShow) goTopButton.classList.add("link-is-visible");

        window.addEventListener('scroll', function() {
            if (window.scrollY >= pxShow) {
                if(!goTopButton.classList.contains('link-is-visible')) goTopButton.classList.add("link-is-visible")
            } else {
                goTopButton.classList.remove("link-is-visible")
            }
        });

    }; // end ssBackToTop


   /* smoothscroll
    * ------------------------------------------------------ */
    const ssMoveTo = function(){

        const easeFunctions = {
            easeInQuad: function (t, b, c, d) {
                t /= d;
                return c * t * t + b;
            },
            easeOutQuad: function (t, b, c, d) {
                t /= d;
                return -c * t* (t - 2) + b;
            },
            easeInOutQuad: function (t, b, c, d) {
                t /= d/2;
                if (t < 1) return c/2*t*t + b;
                t--;
                return -c/2 * (t*(t-2) - 1) + b;
            },
            easeInOutCubic: function (t, b, c, d) {
                t /= d/2;
                if (t < 1) return c/2*t*t*t + b;
                t -= 2;
                return c/2*(t*t*t + 2) + b;
            }
        }

        const triggers = document.querySelectorAll('.smoothscroll');
        
        const moveTo = new MoveTo({
            tolerance: 0,
            duration: 1200,
            easing: 'easeInOutCubic',
            container: window
        }, easeFunctions);

        triggers.forEach(function(trigger) {
            moveTo.registerTrigger(trigger);
        });

    }; // end ssMoveTo


   /* Initialize
    * ------------------------------------------------------ */
    (function ssInit() {

        ssPreloader();
        ssMobileMenu();
        ssSearch();
        if (document.querySelector('.s-pagewrap.ss-home .bricks-wrapper')) {
            ssBlogList();
        } else {
            ssPagination();
            ssMasonry();
        }
        ssAnimateBricks();
        ssSwiper();
        ssAlertBoxes();
        ssBackToTop();
        ssMoveTo();

    })();

})(document.documentElement);