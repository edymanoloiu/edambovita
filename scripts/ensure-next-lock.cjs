// Ensures .next/lock exists after `next build` exits.
// Next.js 16 removes the lock on clean exit; Vercel's builder still lstats it
// and fails with ENOENT if it's missing.
//
// On Vercel, free disk before "Deploying outputs" (ENOSPC). Only remove paths
// that are NOT re-read from disk during packaging — deleting public/ images or
// JSON after build produced empty deploy artifacts. posts/ markdown and
// generated mirrors under public/_* are safe once JSON indexes exist.
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const nextDir = path.join(root, ".next");
const lockPath = path.join(nextDir, "lock");
const cacheDir = path.join(nextDir, "cache");
const previewInfoPath = path.join(cacheDir, ".previewinfo");

function rmIfExists(target, label) {
	if (!fs.existsSync(target)) return false;
	fs.rmSync(target, { recursive: true, force: true });
	console.log(`📌 Removed ${label} to free Vercel deploy disk`);
	return true;
}

// Truncate file contents but keep paths. Vercel packaging lstats known
// .git paths (FETCH_HEAD, pack-*.idx); deleting them causes ENOENT, while
// leaving ~230MB packs causes ENOSPC.
function truncateFilesInTree(dir, label) {
	if (!fs.existsSync(dir)) return 0;
	let freed = 0;
	let files = 0;
	const stack = [dir];
	while (stack.length) {
		const current = stack.pop();
		let entries;
		try {
			entries = fs.readdirSync(current, { withFileTypes: true });
		} catch {
			continue;
		}
		for (const entry of entries) {
			const full = path.join(current, entry.name);
			if (entry.isDirectory()) {
				stack.push(full);
				continue;
			}
			if (!entry.isFile()) continue;
			try {
				const size = fs.statSync(full).size;
				if (size <= 0) continue;
				fs.truncateSync(full, 0);
				freed += size;
				files += 1;
			} catch {
				// Ignore transient lstat/truncate races on Vercel.
			}
		}
	}
	if (files) {
		const mb = (freed / (1024 * 1024)).toFixed(1);
		console.log(
			`📌 Truncated ${files} files under ${label} (~${mb}MB) to free Vercel deploy disk`
		);
	}
	return freed;
}

if (!fs.existsSync(nextDir)) {
	console.warn("⚠️  .next directory missing; skip lock stub");
	process.exit(0);
}

// Require VERCEL_ENV so a local VERCEL=1 experiment cannot wipe the tree.
if (process.env.VERCEL && process.env.VERCEL_ENV) {
	if (fs.existsSync(cacheDir)) {
		for (const name of ["webpack", "swc", "eslint", "images"]) {
			rmIfExists(path.join(cacheDir, name), `.next/cache/${name}`);
		}
	}

	// Markdown already baked into posts-*.json during prebuild (~40MB).
	rmIfExists(path.join(root, "posts"), "posts/");
	// Generated mirrors — static JSON/CDN assets already in /vercel/output.
	rmIfExists(path.join(root, "public", "_posts"), "public/_posts/");
	rmIfExists(path.join(root, "public", "_evergreen"), "public/_evergreen/");

	// Post images are static assets; after next build they live in /vercel/output only.
	rmIfExists(path.join(root, "public", "images", "posts"), "public/images/posts/");

	// Build-only copies under lib/ (public/*.json stays for packaging).
	rmIfExists(path.join(root, "lib", "postsIndex.json"), "lib/postsIndex.json");
	rmIfExists(path.join(root, "lib", "postsBodies.json"), "lib/postsBodies.json");

	// After next build, native SWC compiler binaries are unused (~124MB).
	// Keep node_modules/@swc/helpers — packaging still lstats those files.
	const nextPkgs = path.join(root, "node_modules", "@next");
	if (fs.existsSync(nextPkgs)) {
		for (const name of fs.readdirSync(nextPkgs)) {
			if (!name.startsWith("swc-")) continue;
			rmIfExists(path.join(nextPkgs, name), `node_modules/@next/${name}`);
		}
	}

	// Free ~230MB git pack without deleting paths Vercel still lstats.
	truncateFilesInTree(path.join(root, ".git", "objects"), ".git/objects");
}

fs.mkdirSync(cacheDir, { recursive: true });
if (!fs.existsSync(previewInfoPath)) {
	fs.writeFileSync(previewInfoPath, "");
	console.log("📌 Ensured .next/cache/.previewinfo for Vercel packaging");
}

fs.writeFileSync(lockPath, "");
console.log("📌 Ensured .next/lock for Vercel packaging");
