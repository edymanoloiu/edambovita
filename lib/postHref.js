import { isRecomandarePost } from './recomandarePosts.js';

export function getPostHref(post) {
	if (!post || !post.slug) return '/post/';
	const segment = isRecomandarePost(post) ? 'recomandare' : 'post';
	return `/${segment}/${post.slug}`;
}
