import { getAllPosts } from "../../lib/api";
import { getHomepagePosts } from "../../lib/homepagePostsIndex";
import { fetchPartnerSitemaps } from "../../lib/partnerRssFeeds";
import { isRecomandarePost, dedupePostsBySlug } from "../../lib/recomandarePosts";
import { buildLocalPostsWithPromos, sortPostsByDate } from "../../lib/homepagePosts";
import HeadMeta from "../components/elements/HeadMeta";
import FooterOne from "../components/footer/FooterOne";
import HeaderOne from "../components/header/HeaderOne";
import SoledadTimesHome from "../components/soledad/SoledadTimesHome";
import publication from "../data/publication";
import site from "../data/soledadSite";

const HomeOne = ({ allPosts, localPosts, culturePosts, sitemaps }) => {
	const nationalPosts = sitemaps?.pc ?? [];

	return (
		<>
			<HeadMeta
				fullPageTitle={publication.seo.title}
				metaDesc={publication.seo.description}
				ogTitle={publication.seo.openGraph.title}
				ogDescription={publication.seo.openGraph.description}
				twitterTitle={publication.seo.twitter.title}
				twitterDescription={publication.seo.twitter.description}
			/>
			<HeaderOne />
			<SoledadTimesHome
				localPosts={localPosts}
				culturePosts={culturePosts}
				nationalPosts={nationalPosts}
				sitemaps={sitemaps}
			/>
			<FooterOne />
		</>
	);
};

export default HomeOne;

const RSS_TIMEOUT_MS = 15000;

function rssItemsFromSettled(settled, maxItems) {
	if (!settled || settled.status !== 'fulfilled') return [];
	const items = settled.value?.items;
	return Array.isArray(items) ? items.slice(0, maxItems) : [];
}



export async function getServerSideProps({ res }) {
	if (res) {
		res.setHeader(
			"Cache-Control",
			"public, s-maxage=300, stale-while-revalidate=86400",
		);
		res.setHeader(
			"CDN-Cache-Control",
			"public, s-maxage=300, stale-while-revalidate=86400",
		);
	}


	const posts = (await getHomepagePosts())
		.filter((post) => !isRecomandarePost(post));

	const takeLatest = (predicate, limit = 30) =>
		sortPostsByDate(posts.filter(predicate)).slice(0, limit);

	const uniqueFromAll = dedupePostsBySlug(posts);
	const localPosts = buildLocalPostsWithPromos(uniqueFromAll, site.localCate).slice(0, 60);
	const culturePosts = uniqueFromAll
		.filter((a) => a.cate === 'Evenimente si cultura')
		.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 30);

	const allPosts = [
		...takeLatest((a) => a.cate === 'Evenimente si cultura'),
		...takeLatest((a) => a.cate === site.localCate),
		...takeLatest((a) => a.cate === 'Stiri nationale si internationale'),
		...takeLatest((a) => a.isPromo),
	];

	const weboSitemaps = await Promise.allSettled([
		new Parser({ timeout: RSS_TIMEOUT_MS }).parseURL('https://obliqdesign.ro/rss.xml'),
		new Parser({ timeout: RSS_TIMEOUT_MS }).parseURL('https://meritasamergi.ro/rss.xml'),
		new Parser({ timeout: RSS_TIMEOUT_MS }).parseURL('https://ghidullegal.ro/rss.xml'),
		new Parser({ timeout: RSS_TIMEOUT_MS }).parseURL('https://sfaturidesanatate.ro/rss.xml'),
		new Parser({ timeout: RSS_TIMEOUT_MS }).parseURL('https://ghidulgospodarului.ro/rss.xml'),
		new Parser({ timeout: RSS_TIMEOUT_MS }).parseURL('https://azicemancam.ro/rss.xml'),
		new Parser({ timeout: RSS_TIMEOUT_MS }).parseURL('https://painesicirc.ro/rss.xml'),
	]);

	const cmItems = await fetchCautiMasinaItems(new Parser({ timeout: RSS_TIMEOUT_MS }), 6);

	return {
		props: {
			allPosts,
			localPosts,
			culturePosts,
			sitemaps: {
				obliq: rssItemsFromSettled(weboSitemaps[0], 6),
				mm: rssItemsFromSettled(weboSitemaps[1], 6),
				legal: rssItemsFromSettled(weboSitemaps[2], 6),
				sanatate: rssItemsFromSettled(weboSitemaps[3], 6),
				gospodar: rssItemsFromSettled(weboSitemaps[4], 6),
				azi: rssItemsFromSettled(weboSitemaps[5], 6),
				cm: cmItems,
				pc: rssItemsFromSettled(weboSitemaps[6], 10),
			},
		},
	};
}
