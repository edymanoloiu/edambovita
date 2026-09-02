import Link from "next/link";
import { getPostHref } from "../../../lib/articleRoutes";
import {
	ensureActivePromosOnHomepage,
	getActivePromos,
	sortPostsByDate,
	takeUniquePosts,
} from "../../../lib/homepagePosts";
import site from "../../data/soledadSite";
import SoledadPostCard from "./SoledadPostCard";
import SoledadImportedList from "./SoledadImportedList";
import WidgetNewsletter from "../widget/WidgetNewsletter";
import SocialLink from "../../data/social/SocialLink.json";

const PARTNER_FEEDS = [
	{ key: "obliq", label: "Design" },
	{ key: "mm", label: "Călătorii" },
	{ key: "legal", label: "Legal" },
	{ key: "sanatate", label: "Sănătate" },
	{ key: "gospodar", label: "Gospodărie" },
	{ key: "azi", label: "Bucătărie" },
	{ key: "cm", label: "Auto" },
];

const formatDate = (date) => {
	try {
		return new Date(date).toLocaleDateString("ro-RO", {
			day: "numeric",
			month: "long",
			year: "numeric",
		});
	} catch {
		return "";
	}
};

const MagazineColumn = ({ title, href, featured, items }) => {
	if (!featured && !items?.length) return null;
	return (
		<div className="tm-mag-col">
			<h3 className="tm-mag-col__title">
				<Link href={href}>{title}</Link>
			</h3>
			{featured && (
				<div className="tm-mag-col__featured">
					<SoledadPostCard data={featured} variant="trending" />
				</div>
			)}
			<ul className="tm-mag-col__list">
				{(items || []).map((post) => (
					<li key={post.slug || post.link}>
						<Link href={post.link || getPostHref(post)}>{post.title}</Link>
						<span className="tm-mag-col__date">{formatDate(post.date || post.isoDate)}</span>
					</li>
				))}
			</ul>
		</div>
	);
};

const SoledadTimesHome = ({ localPosts, culturePosts, nationalPosts, sitemaps }) => {
	const seen = new Set();
	const dedupedLocal = localPosts.filter((p) => {
		if (seen.has(p.slug)) return false;
		seen.add(p.slug);
		return true;
	});
	const LOCAL_HOME_COUNT = 6;
	const localCity = sortPostsByDate(
		dedupedLocal.filter((p) => p.cate === site.localCate || p.isPromo),
	);
	const localCategoryPosts = sortPostsByDate(
		dedupedLocal.filter((p) => p.cate === site.localCate && !p.isPromo),
	);
	const evenimente = sortPostsByDate(
		culturePosts.filter((p) => p.cate === "Evenimente si cultura"),
	);
	const activePromos = getActivePromos(localCity);
	const usedSlugs = new Set();
	const promoPriority = () => activePromos.filter((p) => !usedSlugs.has(p.slug));

	const localHomePool =
		localCategoryPosts.length > 0 ? localCategoryPosts : localCity;
	let localHomePosts = takeUniquePosts(
		localHomePool,
		LOCAL_HOME_COUNT,
		usedSlugs,
		promoPriority(),
	);
	let localFeatured = localHomePosts[0];
	let localList = localHomePosts.slice(1);

	let heroPost = takeUniquePosts(localCity, 1, usedSlugs, promoPriority())[0];
	let headlinePosts = takeUniquePosts(localCity, 6, usedSlugs, promoPriority());
	let quickHeadlines = takeUniquePosts(localCity, 4, usedSlugs, promoPriority());
	let latestGrid = takeUniquePosts(localCity, 8, usedSlugs, promoPriority());
	let sidebarPosts = takeUniquePosts(localCity, 5, usedSlugs, promoPriority());

	const evenimenteStories = evenimente.filter((p) => p.story === true);
	const evenimentePool = evenimenteStories.length > 0 ? evenimenteStories : evenimente;
	let evenimenteFeatured = takeUniquePosts(evenimentePool, 1, usedSlugs)[0] || evenimente[0];
	let evenimenteList = takeUniquePosts(evenimentePool, 5, usedSlugs);

	const ensured = ensureActivePromosOnHomepage(activePromos, usedSlugs, [
		{ key: "headlinePosts", posts: headlinePosts, limit: 6 },
		{ key: "quickHeadlines", posts: quickHeadlines, limit: 4 },
		{ key: "latestGrid", posts: latestGrid, limit: 8 },
		{ key: "sidebarPosts", posts: sidebarPosts, limit: 5 },
		{ key: "evenimenteList", posts: evenimenteList, limit: 5 },
		{ key: "localList", posts: localList, limit: LOCAL_HOME_COUNT - 1 },
	]);
	headlinePosts = ensured.headlinePosts;
	quickHeadlines = ensured.quickHeadlines;
	latestGrid = ensured.latestGrid;
	sidebarPosts = ensured.sidebarPosts;
	evenimenteList = ensured.evenimenteList;
	localList = ensured.localList;
	heroPost = heroPost || headlinePosts[0];
	evenimenteFeatured = evenimenteFeatured || evenimente[0];
	localFeatured = localFeatured || heroPost;
	localHomePosts =
		localHomePosts.length > 0
			? localHomePosts
			: [localFeatured, ...localList].filter(Boolean);

	const nationalFeed = nationalPosts?.slice(0, 8) || [];
	const worldFeatured = nationalFeed[0];
	const worldList = nationalFeed.slice(1, 5);

	const partnerHeadlines = PARTNER_FEEDS.map(({ key, label }) => {
		const item = sitemaps?.[key]?.[0];
		return item ? { ...item, partnerLabel: label } : null;
	}).filter(Boolean);

	return (
		<div className="bn2-homepage tm-magazine">
			<h1 className="visually-hidden">{site.pageH1}</h1>

			{heroPost && (
				<section className="bn2-hero soledad-section-gap" style={{ paddingBottom: 0 }}>
					<div className="soledad-container">
						<div className="bn2-hero__grid">
							<div className="bn2-hero__main">
								<SoledadPostCard data={heroPost} variant="hero" />
							</div>
							<div className="bn2-hero__side">
								{headlinePosts.map((post) => (
									<SoledadPostCard key={post.slug} data={post} variant="compact" />
								))}
							</div>
						</div>
					</div>
				</section>
			)}

			{quickHeadlines.length > 0 && (
				<section className="tm-headline-strip">
					<div className="soledad-container">
						<div className="tm-headline-strip__grid">
							{quickHeadlines.map((post) => (
								<article key={post.slug} className="tm-headline-strip__item">
									<Link href={getPostHref(post)} className="tm-headline-strip__title">
										{post.title}
									</Link>
									<span className="tm-headline-strip__date">{formatDate(post.date)}</span>
								</article>
							))}
						</div>
					</div>
				</section>
			)}

			{worldFeatured && (
				<section className="soledad-section-gap soledad-section--alt tm-world">
					<div className="soledad-container">
						<h2 className="soledad-section-title">România &amp; lume</h2>
						<div className="tm-world__grid">
							<div className="tm-world__featured">
								<SoledadPostCard
									data={{
										...worldFeatured,
										title: worldFeatured.title,
										excerpt: (worldFeatured.summary || worldFeatured.description || "")
											.replace(/<[^>]+>/g, "")
											.substring(0, 200),
									}}
									variant="hero"
								/>
							</div>
							<div className="tm-world__list">
								<SoledadImportedList items={worldList} />
							</div>
						</div>
					</div>
				</section>
			)}

			<section className="soledad-section-gap tm-magazine-cols-wrap">
				<div className="soledad-container">
					<div className="tm-magazine-cols">
						<MagazineColumn
							title={site.localBoxTitle}
							href={`/categorie/${site.categorySlug}`}
							featured={localFeatured}
							items={localList}
						/>
						<MagazineColumn
							title="Evenimente & cultură"
							href="/categorie/evenimente-si-cultura"
							featured={evenimenteFeatured}
							items={evenimenteList}
						/>
						<MagazineColumn
							title="Știri naționale"
							href="/categorie/stiri-nationale-si-internationale"
							featured={
								nationalFeed[0]
									? {
											...nationalFeed[0],
											link: nationalFeed[0].link,
											slug: nationalFeed[0].guid,
									  }
									: null
							}
							items={nationalFeed.slice(1, 4).map((item) => ({
								...item,
								link: item.link,
								slug: item.guid,
							}))}
						/>
						<MagazineColumn
							title="Bine de știut"
							href="/categorie/recomandare"
							featured={null}
							items={partnerHeadlines.slice(0, 4)}
						/>
					</div>
				</div>
			</section>

			{latestGrid.length > 0 && (
				<section className="soledad-section-gap">
					<div className="soledad-container">
						<div className="soledad-main-layout">
							<div>
								<h2 className="soledad-section-title">Ultimele articole</h2>
								<div className="soledad-posts-grid">
									{latestGrid.map((post) => (
										<SoledadPostCard key={post.slug} data={post} variant="grid" />
									))}
								</div>
								<div className="soledad-load-more">
									<Link href={`/categorie/${site.categorySlug}`} className="soledad-btn">
										Mai multe articole
									</Link>
								</div>
							</div>
							<aside className="soledad-sidebar">
								<div className="soledad-widget">
									<span className="soledad-widget__label">{site.sidebarLabel}</span>
									<h3 className="soledad-widget__title">{site.sidebarTitle}</h3>
									<p className="soledad-widget__text">{site.sidebarText}</p>
									<div className="soledad-social-row">
										<a href={SocialLink.fb.url} aria-label="Facebook" rel="noopener noreferrer" target="_blank">
											<i className={SocialLink.fb.icon} />
										</a>
										<a href={SocialLink.twitter.url} aria-label="Twitter" rel="noopener noreferrer" target="_blank">
											<i className={SocialLink.twitter.icon} />
										</a>
										<a href={SocialLink.instagram.url} aria-label="Instagram" rel="noopener noreferrer" target="_blank">
											<i className={SocialLink.instagram.icon} />
										</a>
									</div>
								</div>
								<div className="soledad-widget">
									<h3 className="soledad-widget__title">De citit</h3>
									<ul className="soledad-widget-list">
										{sidebarPosts.map((post) => (
											<li key={post.slug}>
												<Link href={getPostHref(post)}>{post.title}</Link>
												<span className="date">{formatDate(post.date)}</span>
											</li>
										))}
									</ul>
								</div>
								<div className="soledad-widget soledad-widget--newsletter">
									<h3 className="soledad-widget__title">Newsletter</h3>
									<WidgetNewsletter />
								</div>
							</aside>
						</div>
					</div>
				</section>
			)}

			{localHomePosts.length > 0 && (
				<section className="soledad-section-gap soledad-section--alt">
					<div className="soledad-container">
						<h2 className="soledad-section-title">{site.localBoxTitle}</h2>
						<div className="soledad-trending-grid">
							{localHomePosts.map((post) => (
								<SoledadPostCard key={post.slug} data={post} variant="trending" />
							))}
						</div>
						<div className="soledad-load-more">
							<Link href={`/categorie/${site.categorySlug}`} className="soledad-btn">
								Toate știrile locale
							</Link>
						</div>
					</div>
				</section>
			)}

			{evenimenteFeatured && (
				<section className="soledad-section-gap soledad-section--alt">
					<div className="soledad-container">
						<h2 className="soledad-section-title">Evenimente și cultură</h2>
						<div className="soledad-trending-grid">
							{(evenimenteStories.length > 0 ? evenimenteStories : evenimente).slice(0, 6).map((post) => (
								<SoledadPostCard key={post.slug} data={post} variant="trending" />
							))}
						</div>
						<div className="soledad-load-more">
							<Link href="/categorie/evenimente-si-cultura" className="soledad-btn">
								Toate evenimentele
							</Link>
						</div>
					</div>
				</section>
			)}

			<section className="soledad-section-gap">
				<div className="soledad-container">
					<h2 className="soledad-section-title">Bine de știut</h2>
					<div className="soledad-partner-grid">
						{PARTNER_FEEDS.map(({ key, label }) => {
							const item = sitemaps?.[key]?.[0];
							if (!item) return null;
							return (
								<article key={key} className="soledad-partner-card">
									<span className="soledad-partner-card__label">{label}</span>
									<h4>
										<a href={item.link}>{item.title}</a>
									</h4>
									<span className="soledad-post-card__date">{formatDate(item.isoDate)}</span>
								</article>
							);
						})}
					</div>
				</div>
			</section>
		</div>
	);
};

export default SoledadTimesHome;
