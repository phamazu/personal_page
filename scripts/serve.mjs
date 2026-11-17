/*
Máy chủ tĩnh tối giản để xem thử trang tại máy.
Không cần cài thêm gì: node scripts/serve.mjs [cổng]

Không dùng cho môi trường thật — trang này là file tĩnh, tải thẳng lên
GitHub Pages, Netlify, Vercel hay bất kỳ hosting nào cũng chạy.
*/
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const PORT = Number(process.argv[2] || process.env.PORT || 4173);

const MIME = {
	".html": "text/html; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".mjs": "text/javascript; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".svg": "image/svg+xml",
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".webp": "image/webp",
	".ico": "image/x-icon",
	".woff2": "font/woff2",
	".txt": "text/plain; charset=utf-8",
	".map": "application/json; charset=utf-8",
};

/* Chặn đường dẫn thoát khỏi thư mục gốc: ../../etc/passwd. */
function safePath(urlPath) {
	const decoded = decodeURIComponent(urlPath.split("?")[0]);
	const relative = normalize(decoded).replace(/^([/\\])+/, "");
	const absolute = join(ROOT, relative);

	if (absolute !== ROOT && !absolute.startsWith(ROOT + sep)) {
		return null;
	}

	return absolute;
}

const server = createServer(async (request, response) => {
	let filePath = safePath(request.url || "/");

	if (!filePath) {
		response.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
		response.end("403 Forbidden");
		return;
	}

	try {
		const info = await stat(filePath);
		if (info.isDirectory()) {
			filePath = join(filePath, "index.html");
		}

		const body = await readFile(filePath);

		response.writeHead(200, {
			"content-type": MIME[extname(filePath).toLowerCase()] || "application/octet-stream",
			"cache-control": "no-cache",
		});
		response.end(body);
	} catch (error) {
		response.writeHead(404, { "content-type": "text/html; charset=utf-8" });
		response.end(
			`<!doctype html><meta charset="utf-8"><title>404</title>` +
				`<body style="font:16px/1.6 system-ui;background:#08060d;color:#f3edf4;padding:3rem">` +
				`<h1>404</h1><p>Không tìm thấy: ${filePath.replace(ROOT, "")}</p>` +
				`<p><a style="color:#ff9dbb" href="/">Về trang chủ</a></p></body>`
		);
	}
});

server.listen(PORT, "127.0.0.1", () => {
	console.log(`Trang cá nhân: http://127.0.0.1:${PORT}`);
	console.log(`Thư mục gốc: ${ROOT}`);
	console.log("Ctrl+C để dừng.");
});
