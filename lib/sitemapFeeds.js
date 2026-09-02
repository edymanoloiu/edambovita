import fs from 'fs';
import path from 'path';
import { getAllPosts } from './api.js';
import { loadPublishedEvergreen } from './local-knowledge/contentLoader.js';

const ARTICLE_WINDOW_MS = 1000 * 60 * 60 * 24 * 90;
const NEWS_WINDOW_MS = 1000 * 60 * 60 * 24 * 2;

const GHIDURI_TYPES = new Set(['guide', 'service', 'explainer']);
const ENTITATI_TYPES = new Set(['place', 'institution', 'person', 'organization']);

function safeDateMs(dateValue) {
	if (!dateValue) return null;
	const t = new Date(dateValue).getTime();
	return Number.isNaN(t) ? null : t;
}

async function loadPosts(fields) {
	const result = getAllPosts(fields);
	return await Promise.resolve(result);
}

async function countRecentArticles() {
	const cutoff = Date.now() - ARTICLE_WINDOW_MS;
	const posts = await loadPosts(['slug', 'date']);
	return posts.filter((p) => {
		const t = safeDateMs(p.date);
		return p?.slug && t != null && t >= cutoff;
	}).length;
}

async function countNewsPosts() {
	const cutoff = Date.now() - NEWS_WINDOW_MS;
	const posts = await loadPosts(['slug', 'date', 'title']);
	return posts.filter((p) => {
		if (!p?.slug || !p?.title) return false;
		const t = safeDateMs(p.date);
		if (t == null || t > Date.now() + 60 * 60 * 1000) return false;
		return t >= cutoff;
	}).length;
}

function countEvergreen(types) {
	return loadPublishedEvergreen().filter((d) => types.has(d.contentType)).length;
}

function hasNewsSitemapPage() {
	return fs.existsSync(path.join(process.cwd(), 'src/pages/news-sitemap.xml.js'));
}

/** Sitemap filenames to include in sitemap-index.xml (non-empty feeds only). */
export async function getActiveSitemapFeeds() {
	const feeds = ['sitemap.xml'];

	if ((await countRecentArticles()) > 0) feeds.push('sitemap-articole.xml');
	if (hasNewsSitemapPage() && (await countNewsPosts()) > 0) feeds.push('news-sitemap.xml');
	if (countEvergreen(GHIDURI_TYPES) > 0) feeds.push('sitemap-ghiduri.xml');
	if (countEvergreen(ENTITATI_TYPES) > 0) feeds.push('sitemap-entitati.xml');
	if (countEvergreen(new Set(['event'])) > 0) feeds.push('sitemap-evenimente.xml');

	return feeds;
}
