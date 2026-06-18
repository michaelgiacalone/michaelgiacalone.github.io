#!/usr/bin/env python3
"""Sync Insights/*.html and blog.html cards from articles/*.docx images and text."""

from __future__ import annotations

import html
import re
import shutil
import zipfile
from pathlib import Path
from xml.etree.ElementTree import fromstring

ROOT = Path(__file__).resolve().parent.parent
ARTICLES_DIR = ROOT / "articles"
ASSETS_DIR = ROOT / "assets"
INSIGHTS_DIR = ROOT / "Insights"
BLOG_HTML = ROOT / "blog.html"

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"

SVG_AUTHOR = (
    '<svg width="18" height="18" fill="none" viewBox="0 0 24 24">'
    '<circle cx="12" cy="8" r="3.25" stroke="currentColor" stroke-width="1.5"/>'
    '<path stroke="currentColor" stroke-width="1.5" '
    'd="M6.8475 19.25H17.1525C18.2944 19.25 19.174 18.2681 18.6408 17.2584'
    'C17.8563 15.7731 16.068 14 12 14C7.93201 14 6.14367 15.7731 5.35924 17.2584'
    'C4.82597 18.2681 5.70558 19.25 6.8475 19.25Z"/></svg>'
)
SVG_CLOCK = (
    '<svg width="18" height="18" fill="none" viewBox="0 0 24 24">'
    '<circle cx="12" cy="12" r="7.25" stroke="currentColor" stroke-width="1.5"/>'
    '<path stroke="currentColor" stroke-width="1.5" d="M12 8V12L14 14"/></svg>'
)
SVG_BACK = (
    '<svg width="16" height="16" fill="none" viewBox="0 0 24 24">'
    '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" '
    'd="M10.25 6.75L4.75 12L10.25 17.25"/>'
    '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" '
    'd="M19.25 12H5"/></svg>'
)

META = {
    1: ("insight-evolution-port-royal-naples-202501", "Neighborhood Spotlight", "January 18, 2025", "4 min read"),
    2: ("insight-why-naples-attracts-luxury-buyers-202502", "Lifestyle", "February 14, 2025", "4 min read"),
    3: ("insight-waterfront-living-naples-buyers-guide-202503", "Buyer's Guide", "March 12, 2025", "4 min read"),
    4: ("insight-architectural-styles-naples-luxury-homes-202504", "Lifestyle", "April 9, 2025", "4 min read"),
    5: ("insight-fifth-avenue-third-street-naples-202505", "Lifestyle", "May 7, 2025", "4 min read"),
    6: ("insight-port-royal-exclusive-neighborhood-202506", "Neighborhood Spotlight", "June 4, 2025", "4 min read"),
    7: (
        "insight-preparing-a-luxury-home-for-sale-in-today-s-naples-market-202606",
        "Seller's Guide",
        "June 11, 2026",
        "3 min read",
    ),
    8: (
        "insight-record-breaking-62m-naples-sale-paul-arpin-202608",
        "Market Update",
        "August 8, 2026",
        "3 min read",
    ),
    9: (
        "insight-port-royal-club-fresh-start-icon-202609",
        "Neighborhood Spotlight",
        "September 12, 2026",
        "5 min read",
    ),
}

# External headline images (override docx export) — same URL for insight cover + blog card
HEADLINE_URL_OVERRIDES: dict[int, str] = {
    9: "https://www.portroyalclub.org/Images/Library/PRC_Renderings_updated_Page_03.jpg",
}

OBSOLETE_SLUGS = [
    "insight-record-breaking-62m-naples-sale-port-royal-202502",
    "insight-5-things-naples-luxury-buyer-202501",
    "insight-aqualane-shores-vs-port-royal-202412",
    "insight-is-now-right-time-sell-naples-202411",
    "insight-q4-2024-naples-luxury-market-report-202410",
    "insight-living-in-naples-southwest-florida-202409",
]


def extract_paragraphs(docx_path: Path) -> list[str]:
    with zipfile.ZipFile(docx_path) as zf:
        root = fromstring(zf.read("word/document.xml"))
    paras: list[str] = []
    for p in root.iter(W + "p"):
        parts = [node.text for node in p.iter() if node.tag == W + "t" and node.text]
        text = "".join(parts).strip()
        if text:
            paras.append(text)
    return paras


def image_order(docx_path: Path) -> list[str]:
    with zipfile.ZipFile(docx_path) as zf:
        xml = zf.read("word/document.xml").decode("utf-8")
        rels = zf.read("word/_rels/document.xml.rels").decode("utf-8")
    order: list[str] = []
    for rid in re.findall(r'r:embed="([^"]+)"', xml):
        m = re.search(rf'Id="{re.escape(rid)}"[^>]*Target="([^"]+)"', rels)
        if m:
            order.append(m.group(1))
    return order


def export_images(num: int, docx_path: Path) -> tuple[str | None, str | None]:
    order = image_order(docx_path)
    headline_name = inline_name = None
    with zipfile.ZipFile(docx_path) as zf:
        for idx, rel in enumerate(order[:2]):
            src = f"word/{rel}"
            if src not in zf.namelist():
                continue
            ext = Path(rel).suffix.lower()
            if ext == ".jpg":
                ext = ".jpg"
            role = "headline" if idx == 0 else "inline"
            out_name = f"insight_{num}_image_{role}{ext}"
            out_path = ASSETS_DIR / out_name
            out_path.write_bytes(zf.read(src))
            if idx == 0:
                headline_name = out_name
            else:
                inline_name = out_name
    return headline_name, inline_name


def parse_article(paras: list[str]) -> tuple[str, str, str, str, list[str]]:
    headline = re.sub(r"^\d+\.\s*", "", paras[0])
    subheadline = excerpt = cta = ""
    i = 1
    while i < len(paras):
        label = paras[i]
        if label == "SEO Title" and i + 1 < len(paras):
            subheadline = paras[i + 1]
            i += 2
            continue
        if label == "Meta Description" and i + 1 < len(paras):
            excerpt = paras[i + 1]
            i += 2
            continue
        if label == "Target Keywords" and i + 1 < len(paras):
            i += 2
            continue
        if label == "Internal Linking Opportunities":
            i += 1
            while i < len(paras) and paras[i] != "Suggested CTA":
                i += 1
            continue
        if label == "Suggested CTA" and i + 1 < len(paras):
            cta = paras[i + 1]
            i += 2
            continue
        break
    body_paras = paras[i:]
    if body_paras and not cta:
        last = body_paras[-1]
        if last.startswith("Thinking about") or "Contact Michael" in last:
            cta = last
            body_paras = body_paras[:-1]
    return headline, subheadline, excerpt, cta, body_paras


def is_section_heading(text: str) -> bool:
    t = text.strip()
    if not t or len(t) > 55:
        return False
    if t.endswith((".", ":", ";")):
        return False
    if t[0].isdigit() or t.startswith(("A ", "An ", "Open ", "Several ", "Expanded ", "Landscaping ")):
        return False
    return True


def cta_label(cta_text: str) -> str:
    if "?" in cta_text:
        return cta_text.split("?")[0].strip() + "?"
    if "." in cta_text:
        return cta_text.split(".")[0].strip() + "."
    return "Request A Private Market Evaluation"


def body_html(
    body_paras: list[str],
    inline_asset: str | None,
    inline_alt: str,
    subheadline: str = "",
) -> str:
    if not body_paras:
        return ""
    chunks: list[str] = []
    if not any(is_section_heading(p) for p in body_paras) and subheadline:
        chunks.append(f"<h2>{html.escape(subheadline)}</h2>")
    body_count = 0
    mid = max(1, len([p for p in body_paras if not is_section_heading(p)]) // 2)
    for para in body_paras:
        if is_section_heading(para):
            chunks.append(f"<h2>{html.escape(para)}</h2>")
        else:
            body_count += 1
            chunks.append(f"<p>{html.escape(para)}</p>")
            if inline_asset and body_count == mid:
                chunks.append(
                    f'<figure class="post-inline-image"><img src="../assets/{html.escape(inline_asset)}" '
                    f'alt="{html.escape(inline_alt)}"></figure>'
                )
    return "\n\n                    ".join(chunks)


def header_block() -> str:
    return """<header id="masthead" class="s-header">
            <div class="s-header__branding">
                <p class="site-title"><a href="../index.html"><img src="https://cdn-cws.datafloat.com/PSB/images/company/PSB/logo-white.png" alt="ARG Naples"></a></p>
            </div>
            <div class="row s-header__navigation">
                <nav class="s-header__nav-wrap">
                    <h3 class="s-header__nav-heading">Navigate to</h3>
                    <ul class="s-header__nav">
                        <li class="has-children"><a href="#0" title="">Featured Neighborhoods</a>
                            <ul class="sub-menu" style="color: white">
                                <li><a href="../communities/port.html">Port Royal</a></li>
                                <li><a href="../communities/aqualane.html">Aqualane Shores</a></li>
                                <li><a href="../communities/olde.html">Olde Naples</a></li>
                                <li><a href="../communities/moorings.html">The Moorings</a></li>
                                <li><a href="../communities/park.html">Park Shore</a></li>
                                <li><a href="../communities/pelican.html">Pelican Bay</a></li>
                            </ul>
                        </li>
                        <li><a href="../soldProperties.html" title="">Significant Sales</a></li>
                        <li><a href="../developments.html" title="">New Developments</a></li>
                        <li class="has-children current-menu-item"><a href="#0" title="">Resources</a>
                            <ul class="sub-menu" style="color: white">
                                <li class="current-menu-item"><a href="../blog.html">Insights</a></li>
                                <li><a href="#pme-request" class="js-pme-modal">Request A Private Market Evaluation</a></li>
                            </ul>
                        </li>
                        <li><a href="../about.html" title="">About Us</a></li>
                    </ul>
                </nav>
            </div>
            <a class="s-header__menu-toggle" href="#0"><span>Menu</span></a>
        </header>"""


def footer_block() -> str:
    return """<footer id="colophon" class="s-footer">
            <div class="row s-footer__subscribe">
                <div class="column lg-12">
                    <h2>Looking to buy or sell?</h2>
                    <p>Let us know how we can help you.</p>
                    <form id="mc-form" class="mc-form">
                        <input type="email" name="EMAIL" id="mce-EMAIL" class="u-fullwidth text-center" placeholder="Your Email Address" required>
                        <input type="submit" name="subscribe" value="Subscribe" class="btn--small btn--primary u-fullwidth">
                        <div class="mc-status"></div>
                    </form>
                </div>
            </div>
            <div class="row s-footer__main">
                <div class="column lg-5 md-6 tab-12 s-footer__about">
                    <h4>ARG Naples</h4>
                    <p>Our proven performance and exceptional marketing expertise consistently deliver the results our clients desire.</p>
                </div>
                <div class="column lg-5 md-6 tab-12">
                    <div class="row">
                        <div class="column lg-6">
                            <h4>Site Links</h4>
                            <ul class="link-list">
                                <li><a href="../index.html">Home</a></li>
                                <li><a href="../developments.html">New Developments</a></li>
                                <li><a href="../blog.html">Insights</a></li>
                                <li><a href="../soldProperties.html">Significant Sales</a></li>
                                <li><a href="../about.html">About</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row s-footer__bottom">
                <div class="column lg-12 tab-12">
                    <div class="ss-copyright"><span>&copy; Copyright ARG Naples</span></div>
                </div>
            </div>
            <div class="ss-go-top">
                <a class="smoothscroll" title="Back to Top" href="#top">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.25 10.25L12 4.75L6.75 10.25"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 19.25V5.75"/></svg>
                </a>
            </div>
        </footer>"""


def author_block() -> str:
    return """<div class="post-author">
                    <img src="../assets/test_michael.jpg" alt="Michael Giacalone">
                    <div>
                        <p class="post-author__name">Michael Giacalone</p>
                        <p class="post-author__title">Global Real Estate Advisor · Premier Sotheby's International Realty · Naples, FL</p>
                        <p class="post-author__bio">Michael is a consistent $100M+ producer with 17+ years of experience and 300+ closed transactions across Naples. A Premier Sotheby's Hall of Fame honoree, he ranks among the top 1.5% of agents companywide and represents buyers and sellers from Port Royal to Marco Island.</p>
                    </div>
                </div>"""


def build_insight_page(article: dict) -> str:
    a = article
    subtitle_html = (
        f'\n            <p class="post-hero__subtitle">{html.escape(a["subheadline"])}</p>\n'
        if a["subheadline"]
        else "\n"
    )
    cover_html = (
        f"""
        <div class="post-cover">
            <img src="{html.escape(a["cover_src"], quote=True)}" alt="{html.escape(a["cover_alt"])}" onerror="var p=this.parentElement;if(p)p.remove()">
        </div>"""
        if a.get("cover_src")
        else ""
    )
    hero_class = "post-hero" if a.get("cover_src") else "post-hero post-hero--text-only"
    cta = (
        f'<p class="post-inline-cta"><a href="#pme-request" class="post-inline-cta__btn js-pme-modal">'
        f'{html.escape(a["cta_label"])}</a></p>'
    )
    return f"""<!DOCTYPE html>
<html lang="en" class="no-js">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{html.escape(a["headline"])} | ARG Naples</title>
    <script>document.documentElement.classList.remove('no-js');document.documentElement.classList.add('js');</script>
    <link rel="stylesheet" href="../css/vendor.css">
    <link rel="stylesheet" href="../css/styles.css">
    <link rel="stylesheet" href="../realestate.css">
    <link rel="stylesheet" href="../css/blog-post-article.css">
    <link rel="stylesheet" href="../css/site-footer.css">
    <link rel="apple-touch-icon" sizes="180x180" href="https://www.sothebysrealty.com/favicon.ico">
    <link rel="icon" type="image/png" sizes="32x32" href="https://www.sothebysrealty.com/favicon.ico">
    <link rel="icon" type="image/png" sizes="16x16" href="https://www.sothebysrealty.com/favicon.ico">
</head>
<body id="top">
    <div id="preloader"><div id="loader" class="dots-fade"><div></div><div></div><div></div></div></div>
    <div id="page" class="s-pagewrap ss-home">
{header_block()}
        <div class="{hero_class}">
            <p class="post-hero__eyebrow">{html.escape(a["category"])} &nbsp;·&nbsp; {html.escape(a["date"])}</p>
            <h1 class="post-hero__title">{html.escape(a["headline"])}</h1>
{subtitle_html}            <div class="post-hero__meta">
                <span class="post-hero__meta-item">{SVG_AUTHOR}Michael Giacalone</span>
                <span class="post-hero__meta-item">{SVG_CLOCK}{html.escape(a["read_time"])}</span>
            </div>
        </div>
{cover_html}
        <article>
            <div class="post-wrap">
                <a href="../blog.html" class="post-back">{SVG_BACK} Back to Insights</a>
                <div class="post-body">
                    {a["body_html"]}

                    {cta}
                </div>
                {author_block()}
            </div>
        </article>
{footer_block()}
    </div>
    <script src="../js/plugins.js"></script>
    <script src="../js/main.js"></script>
    <script src="../js/site-footer.js"></script>
    <script src="../js/subscribe-footer.js"></script>
    <script src="../js/pme-modal.js"></script>
</body>
</html>
"""


def build_blog_card(article: dict) -> str:
    href = f"Insights/{article['slug']}.html"
    cls = "blog-card blog-card--featured" if article["featured"] else "blog-card"
    img = article.get("listing_img") or ""
    return f"""                    <article class="{cls}">
                        <div class="blog-card__image-wrap"><a href="{href}"><img src="{html.escape(img)}" alt="{html.escape(article["cover_alt"])}"></a></div>
                        <div class="blog-card__body">
                            <p class="blog-card__category">{html.escape(article["category"])}</p>
                            <h2 class="blog-card__title"><a href="{href}">{html.escape(article["headline"])}</a></h2>
                            <p class="blog-card__meta"><span>Michael Giacalone</span><span>{html.escape(article["date"])}</span></p>
                            <p class="blog-card__excerpt">{html.escape(article["excerpt"])}</p>
                            <a href="{href}" class="blog-card__readmore">Read More</a>
                        </div>
                    </article>"""


def main() -> None:
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    INSIGHTS_DIR.mkdir(parents=True, exist_ok=True)

    built: list[dict] = []
    for num in range(9, 0, -1):
        docx = ARTICLES_DIR / f"article {num}.docx"
        if not docx.exists():
            print(f"Skip missing {docx.name}")
            continue

        slug, category, date, read_time = META[num]
        paras = extract_paragraphs(docx)
        headline, subheadline, excerpt, cta_text, body_paras = parse_article(paras)
        headline_asset, inline_asset = export_images(num, docx)
        headline_url = HEADLINE_URL_OVERRIDES.get(num)
        cover_src = headline_url or (f"../assets/{headline_asset}" if headline_asset else None)
        listing_img = headline_url or (f"assets/{headline_asset}" if headline_asset else "")

        article = {
            "num": num,
            "slug": slug,
            "headline": headline,
            "subheadline": subheadline,
            "excerpt": excerpt,
            "category": category,
            "date": date,
            "read_time": read_time,
            "headline_asset": headline_asset,
            "cover_src": cover_src,
            "listing_img": listing_img,
            "inline_asset": inline_asset,
            "cover_alt": subheadline or headline,
            "cta_label": cta_label(cta_text),
            "body_html": body_html(body_paras, inline_asset, subheadline or headline, subheadline),
            "featured": num == 9,
        }
        built.append(article)

        out = INSIGHTS_DIR / f"{slug}.html"
        out.write_text(build_insight_page(article), encoding="utf-8")
        print(f"Wrote {out.name} ← article {num} ({headline_asset})")

    for slug in OBSOLETE_SLUGS:
        path = INSIGHTS_DIR / f"{slug}.html"
        if path.exists():
            path.unlink()
            print(f"Removed obsolete {path.name}")

    cards_html = "\n\n".join(build_blog_card(a) for a in built)
    blog = BLOG_HTML.read_text(encoding="utf-8")
    blog = re.sub(
        r"<div class=\"blog-grid\">.*?</div>\s*</div>\s*</section>",
        f"<div class=\"blog-grid\">\n{cards_html}\n\n                </div>\n            </div>\n        </section>",
        blog,
        count=1,
        flags=re.S,
    )
    BLOG_HTML.write_text(blog, encoding="utf-8")
    print(f"Updated {BLOG_HTML.name} with {len(built)} cards")


if __name__ == "__main__":
    main()
