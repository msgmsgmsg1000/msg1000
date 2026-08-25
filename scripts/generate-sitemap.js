const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const today = new Date().toISOString().slice(0, 10);

function loadJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
}

function toLastmod(dateStr) {
  if (!dateStr) return today;
  const m = String(dateStr).match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : today;
}

function esc(url) {
  return String(url).replace(/&/g, "&amp;");
}

function urlEntry(loc, lastmod, changefreq, priority) {
  return [
    "  <url>",
    `    <loc>${esc(loc)}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ].join("\n");
}

function writeUrlset(filePath, entries) {
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entries.join("\n"),
    "</urlset>",
    "",
  ].join("\n");
  fs.writeFileSync(filePath, xml, "utf8");
}

// Reviews/profiles are intentionally excluded from sitemaps (noindex).
const pages = [
  ["https://msgmsgmsg1000.github.io/msg1000/", today, "daily", "1.0"],
  ["https://msgmsgmsg1000.github.io/msg1000/attendance.html", today, "daily", "0.9"],
  ["https://msgmsgmsg1000.github.io/msg1000/notice.html", today, "weekly", "0.8"],
];

const notices = loadJson("gongji/gongji_full.json");

const pageEntries = pages.map(([loc, lastmod, cf, pr]) =>
  urlEntry(loc, lastmod, cf, pr)
);
const noticeEntries = notices.map((item) =>
  urlEntry(
    item.url || `https://msgmsgmsg1000.github.io/msg1000/notice-detail.html?id=${item.uid}`,
    toLastmod(item.details && item.details["작성일"]),
    "monthly",
    "0.5"
  )
);

const allEntries = [...pageEntries, ...noticeEntries];

writeUrlset(path.join(root, "sitemap.xml"), allEntries);

const sitemapsDir = path.join(root, "sitemaps");
fs.mkdirSync(sitemapsDir, { recursive: true });
writeUrlset(path.join(sitemapsDir, "pages.xml"), pageEntries);
writeUrlset(path.join(sitemapsDir, "notices.xml"), noticeEntries);

for (const stale of ["profiles.xml", "reviews.xml"]) {
  const stalePath = path.join(sitemapsDir, stale);
  if (fs.existsSync(stalePath)) fs.unlinkSync(stalePath);
}

const indexXml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  "  <sitemap>",
  "    <loc>https://msgmsgmsg1000.github.io/msg1000/sitemaps/pages.xml</loc>",
  `    <lastmod>${today}</lastmod>`,
  "  </sitemap>",
  "  <sitemap>",
  "    <loc>https://msgmsgmsg1000.github.io/msg1000/sitemaps/notices.xml</loc>",
  `    <lastmod>${today}</lastmod>`,
  "  </sitemap>",
  "</sitemapindex>",
  "",
].join("\n");
fs.writeFileSync(path.join(root, "sitemap-index.xml"), indexXml, "utf8");

console.log({
  total: allEntries.length,
  pages: pageEntries.length,
  notices: noticeEntries.length,
});
