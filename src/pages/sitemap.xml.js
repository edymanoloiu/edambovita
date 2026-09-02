import { getAllPosts } from '../../lib/api';
import { getArticleUrlPath } from '../../lib/articleRoutes';
import { xmlEscape } from '../../lib/xmlEscape';
import publication from '../data/publication';
import { loadPublishedEvergreen } from '../../lib/local-knowledge/contentLoader';
import { getContentTypeMeta } from '../../lib/local-knowledge/contentTypes';

function buildUrlset(entries) {
	const body = entries
		.map(
			(e) => `
  <url>
    <loc>${xmlEscape(e.loc)}</loc>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
    ${e.lastmod ? `<lastmod>${xmlEscape(e.lastmod)}</lastmod>` : ''}
  </url>`
		)
		.join('');
	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}
</urlset>`;
}

function safeIso(dateValue) {
	if (!dateValue) return null;
	const d = new Date(dateValue);
	return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export default function SitemapXml() {
	return null;
}

export async function getServerSideProps({ res }) {
	const SITE = publication.canonicalDomain.replace(/\/$/, '');

	const staticPages = [
		{ loc: `${SITE}/`, changefreq: 'daily', priority: '1.0', lastmod: null },
		{ loc: `${SITE}/ghidul-orasului/`, changefreq: 'weekly', priority: '0.9', lastmod: null },
		{ loc: `${SITE}/institutii/`, changefreq: 'weekly', priority: '0.85', lastmod: null },
		{ loc: `${SITE}/locuri/`, changefreq: 'weekly', priority: '0.8', lastmod: null },
		{ loc: `${SITE}/evenimente/`, changefreq: 'daily', priority: '0.8', lastmod: null },
		{ loc: `${SITE}/servicii-publice/`, changefreq: 'weekly', priority: '0.85', lastmod: null },
		{ loc: `${SITE}/explicatii/`, changefreq: 'weekly', priority: '0.7', lastmod: null },
		{ loc: `${SITE}/trafic-si-transport/`, changefreq: 'weekly', priority: '0.8', lastmod: null },
		{ loc: `${SITE}/despre/`, changefreq: 'monthly', priority: '0.5', lastmod: null },
		{ loc: `${SITE}/politica-editoriala/`, changefreq: 'yearly', priority: '0.3', lastmod: null },
		{ loc: `${SITE}/politica-corecturi/`, changefreq: 'yearly', priority: '0.3', lastmod: null },
		{ loc: `${SITE}/recomandare/`, changefreq: 'daily', priority: '0.65', lastmod: null },
		{ loc: `${SITE}/categorie/${publication.categorySlug}/`, changefreq: 'daily', priority: '0.85', lastmod: null },
		{ loc: `${SITE}/gdpr/`, changefreq: 'yearly', priority: '0.1', lastmod: null },
		{ loc: `${SITE}/cookies/`, changefreq: 'yearly', priority: '0.1', lastmod: null },
	];

	const posts = await getAllPosts(['slug', 'date', 'cate', 'title', 'tags']);
	const postEntries = posts
		.filter((p) => p.slug)
		.map((p) => ({
			loc: `${SITE}/${getArticleUrlPath(p)}/`,
			changefreq: 'daily',
			priority: '0.8',
			lastmod: safeIso(p.date),
		}));

	const evergreen = loadPublishedEvergreen().map((d) => {
		const meta = getContentTypeMeta(d.contentType);
		return {
			loc: `${SITE}/${meta.routePrefix}/${d.slug}/`,
			changefreq: 'weekly',
			priority: '0.75',
			lastmod: safeIso(d.dateModified || d.datePublished),
		};
	});

	const xml = buildUrlset([...staticPages, ...evergreen, ...postEntries]);

	res.setHeader('Content-Type', 'text/xml; charset=utf-8');
	res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
	res.write(xml);
	res.end();

	return { props: {} };
}
