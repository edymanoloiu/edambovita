// Build a slim homepage index so SSR does not parse the 24MB posts-index.json.
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const postsIndexPath = path.join(ROOT, "public", "posts-index.json");
const outPath = path.join(ROOT, "public", "homepage-posts.json");

const HOME_FIELDS = [
	"slug",
	"postFormat",
	"trending",
	"story",
	"title",
	"excerpt",
	"featureImg",
	"thumb",
	"cate",
	"cate_bg",
	"cate_img",
	"author_name",
	"date",
	"post_views",
	"post_share",
	"featureImgSrc",
	"isPromo",
	"topPost",
	"tags",
];

const PER_CATEGORY = 40;
const PROMO_LIMIT = 40;
const FALLBACK_LATEST = 200;

function pick(entry) {
	const out = {};
	for (const field of HOME_FIELDS) {
		if (typeof entry[field] !== "undefined") out[field] = entry[field];
	}
	return out;
}

function byDateDesc(a, b) {
	return new Date(b.date) - new Date(a.date);
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

function main() {
	if (!fs.existsSync(postsIndexPath)) {
		console.warn("⚠️  Missing public/posts-index.json; skip homepage-posts generation.");
		return;
	}

	const rawIndex = JSON.parse(fs.readFileSync(postsIndexPath, "utf8"));
	const index = normalizeIndex(rawIndex);
	if (!index.length) {
		console.warn("⚠️  Empty posts index; skip homepage-posts generation.");
		return;
	}

	const sorted = [...index].sort(byDateDesc);
	const selected = new Map();

	const take = (predicate, limit) => {
		let n = 0;
		for (const entry of sorted) {
			if (!predicate(entry)) continue;
			if (!selected.has(entry.slug)) selected.set(entry.slug, pick(entry));
			n += 1;
			if (n >= limit) break;
		}
	};

	take((p) => p.cate === "Evenimente si cultura", PER_CATEGORY);
	take((p) => p.cate === "Azi in Targoviste", PER_CATEGORY);
	take((p) => p.cate === "Stiri nationale si internationale", PER_CATEGORY);
	take((p) => Boolean(p.isPromo), PROMO_LIMIT);

	if (selected.size < 60) {
		take(() => true, FALLBACK_LATEST);
	}

	const homepagePosts = [...selected.values()].sort(byDateDesc);
	fs.writeFileSync(outPath, JSON.stringify(homepagePosts));
	const kb = (Buffer.byteLength(JSON.stringify(homepagePosts)) / 1024).toFixed(1);
	console.log(`✅ Wrote ${homepagePosts.length} homepage posts (${kb} KB) to ${outPath}`);
}

main();
