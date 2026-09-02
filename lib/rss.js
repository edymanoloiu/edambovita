import RSS from 'rss';
import { isRecomandarePost } from './recomandarePosts.js';

export function generateRssFeed(posts) {
	const feed = new RSS({
		title: 'Azi în Târgoviște | Cele mai importante știri din Târgoviște. Află tot ce contează, azi, în Târgoviște',
		description: 'Azi în Târgoviște este platforma locală de știri care îți aduce zilnic cele mai importante informații despre tot ce se întâmplă în Târgoviște și județul Dâmbovița. Aici găsești actualizări în timp real despre evenimente locale, administrație, trafic, cultură, educație, sport, vreme și comunitate — toate prezentate clar, echilibrat și accesibil. Site-ul prioritează informațiile verificate, explicate pe înțelesul tuturor și optimizate pentru căutare vocală (AEO), astfel încât să poți afla rapid răspunsuri la întrebările tale despre oraș. Azi în Târgoviște este ghidul tău digital pentru un oraș în mișcare, conectând locuitorii la noutățile cu adevărat relevante pentru ei.',
		site_url: 'https://edambovita.ro',
		feed_url: 'https://edambovita.ro/rss.xml',
		language: 'ro',
		image_url: 'https://edambovita.ro/images/cropped_image.png'
	});

	posts.slice(0, 25).forEach(post => {
		feed.item({
			title: post.title,
			description: post.excerpt,
			url: `${feed.site_url.replace(/\/$/, '')}${isRecomandarePost(post) ? '/recomandare/' : '/post/'}${post.slug}`,
			date: post.date,
			categories: post.tags,
			enclosure: {
				url: post.featureImg,
				type: 'image/jpeg',
			},
		});
	});

	return feed.xml({ indent: true });
}
