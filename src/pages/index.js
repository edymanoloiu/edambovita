import Parser from 'rss-parser';
import { getAllPosts } from "../../lib/api";
import { isRecomandarePost, dedupePostsBySlug } from "../../lib/recomandarePosts";
import { buildLocalPostsWithPromos } from "../../lib/homepagePosts";
import HeadMeta from "../components/elements/HeadMeta";
import FooterOne from "../components/footer/FooterOne";
import HeaderOne from "../components/header/HeaderOne";
import SoledadTimesHome from "../components/soledad/SoledadTimesHome";

const LOCAL_CATE = 'Azi in Targoviste';

const HomeOne = ({ allPosts, localPosts, culturePosts, sitemaps }) => {
	const nationalPosts = sitemaps?.pc ?? [];

	return (
		<>
			<HeadMeta metaTitle="Știrile zilei în Târgoviște | Cele mai importante știri din Târgoviște. Află tot ce contează, azi, în Târgoviște." />
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

export async function getServerSideProps() {
	const posts = getAllPosts([
		'postFormat',
		'trending',
		'story',
		'slug',
		'title',
		'excerpt',
		'featureImg',
		'cate',
		'cate_bg',
		'cate_img',
		'author_name',
		'date',
		'post_views',
		'post_share',
		'featureImgSrc',
		'thumb',
		'isPromo',
		'topPost',
		'tags',
	])
		.filter((post) => !isRecomandarePost(post))
		.sort((a, b) => new Date(b.date) - new Date(a.date));

	const uniqueFromAll = dedupePostsBySlug(posts);
	const localPosts = buildLocalPostsWithPromos(uniqueFromAll, LOCAL_CATE).slice(0, 60);
	const culturePosts = uniqueFromAll
		.filter((a) => a.cate === 'Evenimente si cultura')
		.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 30);

	const allPosts = [
		...posts.filter((a) => a.cate === 'Evenimente si cultura').slice(0, 30),
		...posts.filter((a) => a.cate === LOCAL_CATE).slice(0, 30),
		...posts.filter((a) => a.cate === 'Stiri nationale si internationale').slice(0, 30),
		...posts.filter((a) => a.isPromo).slice(0, 30),
	];

	const rssParser = new Parser({ timeout: RSS_TIMEOUT_MS });
	const feedUrls = [
		'https://obliqdesign.ro/rss.xml',
		'https://meritasamergi.ro/rss.xml',
		'https://ghidullegal.ro/rss.xml',
		'https://sfaturidesanatate.ro/rss.xml',
		'https://ghidulgospodarului.ro/rss.xml',
		'https://azicemancam.ro/rss.xml',
		'https://cautimasina.ro/rss.xml',
		'https://painesicirc.ro/rss.xml',
	];
	const weboSitemaps = await Promise.allSettled(feedUrls.map((url) => rssParser.parseURL(url)));

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
				cm: rssItemsFromSettled(weboSitemaps[6], 6),
				pc: rssItemsFromSettled(weboSitemaps[7], 10),
			},
		},
	};
}
