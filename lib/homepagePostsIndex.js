import fs from "fs";
import path from "path";

let homepageCache = null;
let homepagePromise = null;

function getSiteUrl() {
	return (
		process.env.POSTS_ASSET_BASE_URL ||
		process.env.NEXT_PUBLIC_SITE_URL ||
		process.env.SITE_URL ||
		"https://edambovita.ro"
	);
}

function normalizeIndex(index) {
	if (Array.isArray(index)) return index;
	if (index && typeof index === "object") {
		return Object.entries(index).map(([slug, data]) => ({
			slug,
			...(data && typeof data === "object" ? data : {}),
		}));
	}
	return [];
}

function readJsonCandidates(names) {
	const bases = [
		path.join(process.cwd(), "public"),
		path.join(process.cwd(), ".open-next", "assets"),
	];
	for (const base of bases) {
		for (const name of names) {
			const filePath = path.join(base, name);
			try {
				if (!fs.existsSync(filePath)) continue;
				return JSON.parse(fs.readFileSync(filePath, "utf8"));
			} catch {
				// try next
			}
		}
	}
	return null;
}

function slimFromFullIndex(index) {
	const posts = normalizeIndex(index);
	if (!posts.length) return null;
	return posts
		.slice()
		.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
		.slice(0, 200);
}

async function readFromAssets() {
	try {
		const mod = await import("@opennextjs/cloudflare");
		const ctx = mod.getCloudflareContext?.();
		const env = ctx?.env;
		if (!env?.ASSETS?.fetch) return null;
		const res = await env.ASSETS.fetch(
			new Request("https://assets.local/homepage-posts.json"),
		);
		if (!res.ok) return null;
		return res.json();
	} catch {
		return null;
	}
}

export async function getHomepagePosts() {
	if (homepageCache) return homepageCache;
	if (homepagePromise) return homepagePromise;

	homepagePromise = (async () => {
		const localHome = readJsonCandidates(["homepage-posts.json"]);
		if (localHome) {
			homepageCache = normalizeIndex(localHome);
			if (homepageCache.length) return homepageCache;
		}

		const localFull = readJsonCandidates(["posts-index.json"]);
		const slim = localFull ? slimFromFullIndex(localFull) : null;
		if (slim?.length) {
			homepageCache = slim;
			return homepageCache;
		}

		const fromAssets = await readFromAssets();
		if (fromAssets) {
			homepageCache = normalizeIndex(fromAssets);
			if (homepageCache.length) return homepageCache;
		}

		const res = await fetch(new URL("/homepage-posts.json", getSiteUrl()).toString());
		if (!res.ok) {
			throw new Error(`Failed to load homepage posts: ${res.status}`);
		}
		homepageCache = normalizeIndex(await res.json());
		return homepageCache;
	})();

	return homepagePromise;
}
