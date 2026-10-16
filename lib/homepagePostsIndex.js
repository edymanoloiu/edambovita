import fs from "fs";
import path from "path";

let homepageCache = null;
let homepagePromise = null;

function getSiteUrl(fallbackDomain) {
	return (
		process.env.POSTS_ASSET_BASE_URL ||
		process.env.NEXT_PUBLIC_SITE_URL ||
		process.env.SITE_URL ||
		fallbackDomain
	);
}

function readLocalHomepagePosts() {
	const candidates = [
		path.join(process.cwd(), "public", "homepage-posts.json"),
		path.join(process.cwd(), ".open-next", "assets", "homepage-posts.json"),
	];
	for (const filePath of candidates) {
		try {
			if (!fs.existsSync(filePath)) continue;
			return JSON.parse(fs.readFileSync(filePath, "utf8"));
		} catch {
			// try next
		}
	}
	return null;
}

async function readFromAssets() {
	// Optional Cloudflare path — dynamic import so Vercel/webpack never bundles it.
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

/**
 * Slim homepage listing instead of the full posts-index.
 */
export async function getHomepagePosts(fallbackDomain = "https://edambovita.ro") {
	if (homepageCache) return homepageCache;
	if (homepagePromise) return homepagePromise;

	homepagePromise = (async () => {
		const local = readLocalHomepagePosts();
		if (local) {
			homepageCache = local;
			return homepageCache;
		}

		const fromAssets = await readFromAssets();
		if (fromAssets) {
			homepageCache = fromAssets;
			return homepageCache;
		}

		const res = await fetch(
			new URL("/homepage-posts.json", getSiteUrl(fallbackDomain)).toString(),
		);
		if (!res.ok) {
			throw new Error(`Failed to load homepage posts: ${res.status}`);
		}
		homepageCache = await res.json();
		return homepageCache;
	})();

	return homepagePromise;
}
