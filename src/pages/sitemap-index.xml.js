import publication from '../data/publication';
import { xmlEscape } from '../../lib/xmlEscape';
import { getActiveSitemapFeeds } from '../../lib/sitemapFeeds';

export default function SitemapIndex() { return null; }

export async function getServerSideProps({ res }) {
	const site = publication.canonicalDomain.replace(/\/$/, '');
	const files = await getActiveSitemapFeeds();
	const body = files.map((f) => `
  <sitemap>
    <loc>${xmlEscape(`${site}/${f}`)}</loc>
  </sitemap>`).join('');
	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}
</sitemapindex>`;
	res.setHeader('Content-Type', 'text/xml; charset=utf-8');
	res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
	res.write(xml);
	res.end();
	return { props: {} };
}
