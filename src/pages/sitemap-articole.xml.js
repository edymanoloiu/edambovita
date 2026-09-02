import { getAllPosts } from '../../lib/api';
import { getArticleUrlPath } from '../../lib/articleRoutes';
import { xmlEscape } from '../../lib/xmlEscape';
import publication from '../data/publication';

function buildUrlset(entries) {
	const body = entries.map((e) => `
  <url>
    <loc>${xmlEscape(e.loc)}</loc>
    ${e.lastmod ? `<lastmod>${xmlEscape(e.lastmod)}</lastmod>` : ''}
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`).join('');
	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}
</urlset>`;
}

export default function Sitemap() { return null; }

export async function getServerSideProps({ res }) {
	const site = publication.canonicalDomain.replace(/\/$/, '');
	const posts = await getAllPosts(['slug', 'date', 'cate', 'title', 'tags']);
	const cutoff = Date.now() - 1000 * 60 * 60 * 24 * 90;
	const entries = posts
		.filter((p) => p.slug && !Number.isNaN(new Date(p.date).getTime()) && new Date(p.date).getTime() >= cutoff)
		.map((p) => ({
			loc: `${site}/${getArticleUrlPath(p)}/`,
			lastmod: new Date(p.date).toISOString(),
		}));
	if (!entries.length) {
		res.statusCode = 404;
		res.end();
		return { props: {} };
	}
	res.setHeader('Content-Type', 'text/xml; charset=utf-8');
	res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
	res.write(buildUrlset(entries));
	res.end();
	return { props: {} };
}
