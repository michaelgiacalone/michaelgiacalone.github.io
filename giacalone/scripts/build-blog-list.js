#!/usr/bin/env node
/**
 * Build blogs/manifest.json from HTML files in blogs/
 * Run from project root: node scripts/build-blog-list.js
 *
 * - Scans blogs/*.html (skips _template.html and files starting with _)
 * - Output includes ONLY entries for files that exist on disk (deleted files are removed)
 * - For each file: reads <title> and optional <meta name="blog-*"> tags
 * - Merges with existing manifest for that file (keeps your edits), new files get defaults
 * - Writes blogs/manifest.json
 *
 * Optional meta tags in each blog HTML (for auto-fill when adding new posts):
 *   <meta name="blog-date" content="2025-02-21">
 *   <meta name="blog-category" content="Design">
 *   <meta name="blog-excerpt" content="Short description...">
 *   <meta name="blog-author" content="Your Name">
 *   <meta name="blog-image" content="images/thumbs/masonry/statue-600.jpg">
 *   <meta name="blog-image2x" content="images/thumbs/masonry/statue-1200.jpg">
 */

const fs = require('fs');
const path = require('path');

const BLOGS_DIR = path.join(__dirname, '..', 'blogs');
const MANIFEST_PATH = path.join(BLOGS_DIR, 'manifest.json');
const DEFAULT_IMAGE = 'images/thumbs/masonry/statue-600.jpg';
const DEFAULT_IMAGE2X = 'images/thumbs/masonry/statue-1200.jpg';

function extractMeta(html, name) {
  const re = new RegExp('<meta\\s+name="' + name + '"\\s+content="([^"]*)"', 'i');
  const m = html.match(re);
  return m ? m[1].trim() : null;
}

function extractTitle(html) {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  if (!m) return null;
  return m[1].replace(/\s*[-|–]\s*Spurgeon\s*$/i, '').trim();
}

function getPostFromHtml(fileName) {
  const filePath = path.join(BLOGS_DIR, fileName);
  if (!fs.existsSync(filePath)) return null;
  const html = fs.readFileSync(filePath, 'utf8');
  const title = extractTitle(html) || fileName.replace(/\.html$/i, '').replace(/-/g, ' ');
  return {
    file: fileName,
    title: title,
    date: extractMeta(html, 'blog-date') || new Date().toISOString().slice(0, 10),
    category: extractMeta(html, 'blog-category') || 'Uncategorized',
    excerpt: extractMeta(html, 'blog-excerpt') || '',
    image: extractMeta(html, 'blog-image') || DEFAULT_IMAGE,
    image2x: extractMeta(html, 'blog-image2x') || DEFAULT_IMAGE2X,
    author: extractMeta(html, 'blog-author') || 'Spurgeon',
  };
}

function main() {
  if (!fs.existsSync(BLOGS_DIR)) {
    fs.mkdirSync(BLOGS_DIR, { recursive: true });
    console.log('Created blogs/ folder. Add .html files and run this script again.');
    return;
  }

  const files = fs.readdirSync(BLOGS_DIR)
    .filter((f) => f.endsWith('.html') && !f.startsWith('_'));

  let existing = { posts: [] };
  if (fs.existsSync(MANIFEST_PATH)) {
    try {
      existing = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
      if (!Array.isArray(existing.posts)) existing.posts = [];
    } catch (e) {
      existing = { posts: [] };
    }
  }

  const byFile = new Map();
  // Only include entries for files that exist on disk (removes deleted files from manifest)
  files.forEach((fileName) => {
    const fromHtml = getPostFromHtml(fileName);
    if (!fromHtml) return;
    const prev = existing.posts.find((p) => p.file === fileName);
    if (prev) {
      byFile.set(fileName, { ...fromHtml, ...prev, file: fileName });
    } else {
      byFile.set(fileName, fromHtml);
    }
  });

  const posts = Array.from(byFile.values())
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const manifest = { posts };
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log('Updated blogs/manifest.json with', posts.length, 'post(s).');
}

main();
