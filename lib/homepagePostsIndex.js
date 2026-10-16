import fs from "fs";
import path from "path";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import publication from "../src/data/publication.js";

let homepageCache = null;
let homepagePromise = null;

function getSiteUrl() {
	if (publication?.canonicalDomain) return publication.canonicalDomain;
	return (
		process.env.POSTS_ASSET_BASE_URL ||
		process.env.NEXT_PUBLIC_SITE_URL ||
		process.env.SITE_URL ||
		publication?.canonicalDomain ||
		"https://edambovita.ro"
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
	try {
		const { env } = getCloudflareContext();
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
 * Slim homepage listing (~tens of KB) instead of the full 24MB posts-index.
 */
export async function getHomepagePosts() {
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

		const res = await fetch(new URL("/homepage-posts.json", getSiteUrl()).toString());
		if (!res.ok) {
			throw new Error(`Failed to load homepage posts: ${res.status}`);
		}
		homepageCache = await res.json();
		return homepageCache;
	})();

	return homepagePromise;
}
