#!/usr/bin/env node

const { google } = require('googleapis');
const { parseString } = require('xml2js');
const path = require('path');

const SITEMAPS = [
  'https://www.architecturehelper.com/sitemap.xml',
  'https://www.cresoftware.tech/sitemap.xml',
];
const KEY_PATH = path.join(process.env.HOME, '.config/secrets/google-search-console.json');
const MAX_URLS_PER_DAY = 200;
const DELAY_MS = 1000;

async function fetchSitemapUrls(sitemapUrl) {
  const res = await fetch(sitemapUrl);
  if (!res.ok) throw new Error(`Failed to fetch ${sitemapUrl}: ${res.status}`);
  const xml = await res.text();

  return new Promise((resolve, reject) => {
    parseString(xml, (err, result) => {
      if (err) return reject(err);
      // Handle sitemap index (nested sitemaps) or regular urlset
      if (result.sitemapindex) {
        // Return sub-sitemap URLs to fetch recursively
        const locs = result.sitemapindex.sitemap.map(s => s.loc[0]);
        resolve({ type: 'index', urls: locs });
      } else if (result.urlset) {
        const locs = result.urlset.url.map(u => u.loc[0]);
        resolve({ type: 'urlset', urls: locs });
      } else {
        resolve({ type: 'urlset', urls: [] });
      }
    });
  });
}

async function getAllUrls(sitemapUrl) {
  const result = await fetchSitemapUrls(sitemapUrl);
  if (result.type === 'urlset') return result.urls;

  // Sitemap index - fetch each sub-sitemap
  const allUrls = [];
  for (const subUrl of result.urls) {
    const sub = await fetchSitemapUrls(subUrl);
    allUrls.push(...sub.urls);
  }
  return allUrls;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log('🔑 Authenticating with service account...');
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_PATH,
    scopes: ['https://www.googleapis.com/auth/indexing'],
  });
  const client = await auth.getClient();
  const indexing = google.indexing({ version: 'v3', auth: client });

  // Collect all URLs from all sitemaps
  let allUrls = [];
  for (const sitemap of SITEMAPS) {
    console.log(`📥 Fetching sitemap: ${sitemap}`);
    try {
      const urls = await getAllUrls(sitemap);
      console.log(`   Found ${urls.length} URLs`);
      allUrls.push(...urls);
    } catch (err) {
      console.error(`   ❌ Error fetching ${sitemap}: ${err.message}`);
    }
  }

  console.log(`\n📊 Total URLs found: ${allUrls.length}`);

  const toSubmit = allUrls.slice(0, MAX_URLS_PER_DAY);
  const pending = allUrls.slice(MAX_URLS_PER_DAY);

  if (pending.length > 0) {
    console.log(`⚠️  Quota limit: submitting ${toSubmit.length}, ${pending.length} pending`);
  }

  let successes = 0;
  let failures = 0;

  for (let i = 0; i < toSubmit.length; i++) {
    const url = toSubmit[i];
    try {
      await indexing.urlNotifications.publish({
        requestBody: { url, type: 'URL_UPDATED' },
      });
      successes++;
      console.log(`✅ [${i + 1}/${toSubmit.length}] ${url}`);
    } catch (err) {
      failures++;
      const msg = err.response?.data?.error?.message || err.message;
      console.error(`❌ [${i + 1}/${toSubmit.length}] ${url} — ${msg}`);
    }
    if (i < toSubmit.length - 1) await sleep(DELAY_MS);
  }

  console.log(`\n📋 Results: ${successes} succeeded, ${failures} failed`);
  if (pending.length > 0) {
    console.log(`\n⏳ Pending URLs (${pending.length}):`);
    pending.forEach(u => console.log(`   ${u}`));
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
