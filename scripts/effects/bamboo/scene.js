/*
Bộ điều phối cảnh nền.
- Chọn WebGL khi máy hỗ trợ, tự lùi về Canvas 2D nếu không.
- Ba chế độ: "auto" (lá đầy đủ), "light" (nhẹ), "off" (tĩnh).
- Nhớ lựa chọn, tạm dừng khi tab bị ẩn, tôn trọng prefers-reduced-motion.
*/
(function (window, document) {
	"use strict";

	var config = window.BambooConfig;
	var MODES = ["auto", "light", "off"];
	var STORAGE_KEY = "phuoc.effect";

	var state = {
		canvas: null,
		renderer: null,
		mode: "auto",
		time: 0,
		raf: 0,
		lastFrame: 0,
		running: false,
		resizeObserver: null,
		listeners: [],
	};

	function isMobile() {
		return (
			window.matchMedia("(max-width: " + config.quality.mobileBreakpoint + "px)").matches ||
			(navigator.maxTouchPoints > 0 &&
				window.matchMedia("(pointer: coarse)").matches)
		);
	}

	function prefersReducedMotion() {
		return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	}

	function webglAvailable() {
		try {
			var probe = document.createElement("canvas");
			var context =
				probe.getContext("webgl") || probe.getContext("experimental-webgl");
			if (!context) {
				return false;
			}
			var lose = context.getExtension("WEBGL_lose_context");
			if (lose) {
				lose.loseContext();
			}
			return true;
		} catch (error) {
			return false;
		}
	}

	function readMode() {
		try {
			var saved = window.localStorage.getItem(STORAGE_KEY);
			if (MODES.indexOf(saved) !== -1) {
				return saved;
			}
		} catch (error) {
			/* localStorage bị chặn. */
		}

		return prefersReducedMotion() ? "off" : "auto";
	}

	function writeMode(mode) {
		try {
			window.localStorage.setItem(STORAGE_KEY, mode);
		} catch (error) {
			/* Bỏ qua. */
		}
	}

	function rendererCount(kind) {
		var mobile = isMobile();
		var table = config.leaves.count[kind] || config.leaves.count.webgl;
		return mobile ? table.mobile : table.desktop;
	}

	/* Canvas mới tinh: WebGL và 2D không thể cùng tồn tại trên một phần tử. */
	function replaceCanvas() {
		var current = state.canvas;
		var next = current.cloneNode(false);
		current.parentNode.replaceChild(next, current);
		state.canvas = next;
		return next;
	}

	function currentMode() {
		return state.mode;
	}

	/*
	Đổi bảng màu lá theo giao diện ("light" hoặc "dark").
	Với WebGL, renderer đọc config mỗi khung hình nên chỉ cần sửa config.
	Với Canvas 2D, gradient được dựng lại qua setPalette().
	*/
	function setTheme(name) {
		var palette = config.palettes[name] || config.palettes.dark;

		config.color = palette.color;
		config.depthOfField.alphaNear = palette.alphaNear;
		config.depthOfField.alphaFar = palette.alphaFar;
		config.depthOfField.softnessFar = palette.softnessFar;

		if (state.renderer && typeof state.renderer.setPalette === "function") {
			state.renderer.setPalette(config);
		}
	}

	function themeFromDocument() {
		return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
	}

	function notify() {
		state.listeners.forEach(function (callback) {
			callback(state.mode);
		});
	}

	function stopLoop() {
		state.running = false;
		state.lastFrame = 0;

		if (state.raf) {
			window.cancelAnimationFrame(state.raf);
			state.raf = 0;
		}
	}

	function startLoop() {
		if (state.running || !state.renderer) {
			return;
		}

		state.running = true;
		state.lastFrame = 0;
		state.raf = window.requestAnimationFrame(frame);
	}

	function frame(timestamp) {
		if (!state.running || !state.renderer) {
			return;
		}

		if (state.lastFrame) {
			/* Cộng dồn thời gian hoạt động để chuyển động không nhảy khi quay lại tab. */
			state.time += Math.min(0.06, (timestamp - state.lastFrame) / 1000);
		}

		state.lastFrame = timestamp;
		state.renderer.draw(state.time);
		state.raf = window.requestAnimationFrame(frame);
	}

	function resize() {
		var canvas = state.canvas;
		if (!canvas) {
			return;
		}

		var dpr = Math.min(window.devicePixelRatio || 1, config.quality.maxDpr);
		var width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
		var height = Math.max(1, Math.floor(canvas.clientHeight * dpr));

		if (canvas.width !== width || canvas.height !== height) {
			canvas.width = width;
			canvas.height = height;
			state.renderer.resize(width, height);
		}
	}

	function createRenderer(mode) {
		var canvas = replaceCanvas();
		var renderer = null;

		if (mode === "auto") {
			renderer = window.BambooRenderer.create(canvas, {
				count: rendererCount("webgl"),
				onLost: function () {
					/* Mất ngữ cảnh WebGL: chuyển sang bản nhẹ để trang không trắng nền. */
					applyMode("light", false);
				},
			});
		}

		if (!renderer) {
			renderer = window.BambooCanvas2D.create(canvas, {
				count: isMobile()
					? config.canvas2d.count.mobile
					: config.canvas2d.count.desktop,
			});
		}

		return renderer;
	}

	function destroyRenderer() {
		if (state.renderer && typeof state.renderer.dispose === "function") {
			state.renderer.dispose();
		}
		state.renderer = null;
	}

	function applyMode(mode, persist) {
		state.mode = mode;

		if (persist !== false) {
			writeMode(mode);
		}

		stopLoop();
		destroyRenderer();

		document.body.classList.toggle("is-still", mode === "off");

		if (mode === "off") {
			document.body.classList.remove("is-scene-ready");
			if (state.canvas) {
				state.canvas.width = 0;
				state.canvas.height = 0;
			}
			notify();
			return;
		}

		state.renderer = createRenderer(mode);

		if (!state.renderer) {
			document.body.classList.remove("is-scene-ready");
			notify();
			return;
		}

		resize();
		state.time = 0;
		state.renderer.draw(0);
		document.body.classList.add("is-scene-ready");
		startLoop();
		notify();
	}

	function setMode(mode, options) {
		if (MODES.indexOf(mode) === -1 || mode === state.mode) {
			return;
		}

		applyMode(mode, !(options && options.persist === false));
	}

	function cycleMode() {
		var index = MODES.indexOf(state.mode);
		var next = MODES[(index + 1) % MODES.length];
		applyMode(next, true);
		return next;
	}

	function handleVisibility() {
		if (document.hidden) {
			stopLoop();
		} else {
			startLoop();
		}
	}

	function handleResize() {
		if (!state.renderer) {
			return;
		}

		resize();
		state.renderer.draw(state.time);
	}

	function init() {
		state.canvas = document.getElementById(config.canvasId);

		if (!state.canvas) {
			return;
		}

		setTheme(themeFromDocument());
		applyMode(readMode(), false);

		if (window.ResizeObserver) {
			state.resizeObserver = new window.ResizeObserver(handleResize);
			state.resizeObserver.observe(document.documentElement);
		} else {
			window.addEventListener("resize", handleResize);
		}

		document.addEventListener("visibilitychange", handleVisibility);

		/* Đổi cài đặt giảm chuyển động của hệ điều hành ⇒ tôn trọng ngay. */
		var motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
		var onMotionChange = function (event) {
			if (event.matches && state.mode !== "off") {
				applyMode("off", false);
			}
		};

		if (typeof motionQuery.addEventListener === "function") {
			motionQuery.addEventListener("change", onMotionChange);
		} else if (typeof motionQuery.addListener === "function") {
			motionQuery.addListener(onMotionChange);
		}
	}

	function on(callback) {
		state.listeners.push(callback);
		return function unsubscribe() {
			state.listeners = state.listeners.filter(function (item) {
				return item !== callback;
			});
		};
	}

	window.BambooScene = {
		init: init,
		on: on,
		modes: MODES.slice(),
		getMode: currentMode,
		setMode: setMode,
		setTheme: setTheme,
		cycleMode: cycleMode,
		hasWebgl: webglAvailable,
	};
})(window, document);
