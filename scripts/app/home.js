/*
Khởi động trang chủ:
- Bỏ trạng thái chờ để chạy hiệu ứng mở trang.
- Xoay vòng câu nói, đổi bằng bàn phím.
- Mở/đóng các bảng Thở · Câu nói · Về (có bẫy focus, đóng bằng Esc).
- Nhịp thở 4 · 2 · 6 và nút đổi hiệu ứng hoa.
*/
(function (window, document) {
	"use strict";

	var i18n = window.AppI18n;
	var scene = window.BambooScene;
	var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	var QUOTE_INTERVAL = 7000;

	var elements = {
		quote: document.querySelector("[data-quote]"),
		quoteList: document.querySelector("[data-quote-list]"),
		overlay: document.querySelector("[data-overlay]"),
		overlayFrame: document.querySelector(".overlay__frame"),
		panels: Array.prototype.slice.call(document.querySelectorAll("[data-panel]")),
		effectButton: document.querySelector("[data-effect-toggle]"),
		effectLabel: document.querySelector("[data-effect-label]"),
		themeButton: document.querySelector("[data-theme-toggle]"),
		themeLabel: document.querySelector("[data-theme-label]"),
	};

	var quoteIndex = 0;
	var quoteTimer = 0;
	var quoteSwapTimer = 0;
	var overlayOpen = false;
	var closingOverlay = false;
	var lastFocused = null;

	/* ---------------------------------------------------------------- intro */

	function initIntro() {
		var released = false;

		function release() {
			if (released) {
				return;
			}
			released = true;
			document.body.classList.remove("is-preload");
		}

		if (document.readyState === "complete") {
			window.requestAnimationFrame(function () {
				window.requestAnimationFrame(release);
			});
		} else {
			window.addEventListener("load", release, { once: true });
		}

		/* Lưới an toàn: dù ảnh chậm, nội dung vẫn hiện sau 1,2 giây. */
		window.setTimeout(release, 1200);
	}

	/* --------------------------------------------------------------- quotes */

	function currentQuotes() {
		return i18n.quotes();
	}

	function paintQuote(instant) {
		var list = currentQuotes();
		quoteIndex = ((quoteIndex % list.length) + list.length) % list.length;

		if (!elements.quote) {
			return;
		}

		if (instant || reduceMotion) {
			elements.quote.textContent = list[quoteIndex];
			elements.quote.classList.remove("is-leaving");
			return;
		}

		elements.quote.classList.add("is-leaving");
		window.clearTimeout(quoteSwapTimer);
		quoteSwapTimer = window.setTimeout(function () {
			elements.quote.textContent = list[quoteIndex];
			elements.quote.classList.remove("is-leaving");
		}, 420);
	}

	function stepQuote(direction) {
		quoteIndex += direction;
		paintQuote(false);
		restartQuoteTimer();
	}

	function restartQuoteTimer() {
		window.clearInterval(quoteTimer);

		if (reduceMotion) {
			return;
		}

		quoteTimer = window.setInterval(function () {
			if (overlayOpen || document.hidden) {
				return;
			}
			quoteIndex += 1;
			paintQuote(false);
		}, QUOTE_INTERVAL);
	}

	function renderQuoteList() {
		if (!elements.quoteList) {
			return;
		}

		var list = currentQuotes();
		var fragment = document.createDocumentFragment();

		list.forEach(function (text) {
			var item = document.createElement("li");
			item.className = "quote-list__item";

			var paragraph = document.createElement("p");
			paragraph.className = "quote-list__text";
			paragraph.textContent = text;

			item.appendChild(paragraph);
			fragment.appendChild(item);
		});

		elements.quoteList.replaceChildren(fragment);
	}

	/* -------------------------------------------------------------- overlay */

	function focusableInside(container) {
		return Array.prototype.slice
			.call(
				container.querySelectorAll(
					'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
				)
			)
			.filter(function (node) {
				return !node.disabled && node.offsetParent !== null;
			});
	}

	function openOverlay(name) {
		if (!elements.overlay) {
			return;
		}

		var panel = elements.panels.filter(function (item) {
			return item.getAttribute("data-panel") === name;
		})[0];

		if (!panel) {
			return;
		}

		lastFocused = document.activeElement;

		elements.panels.forEach(function (item) {
			item.hidden = item !== panel;
		});

		var title = panel.querySelector(".panel__title");
		if (title && elements.overlayFrame) {
			elements.overlayFrame.setAttribute("aria-labelledby", title.id);
		}

		elements.overlay.hidden = false;
		elements.overlay.setAttribute("data-active-panel", name);

		window.requestAnimationFrame(function () {
			elements.overlay.classList.add("is-open");
		});

		overlayOpen = true;
		document.body.classList.add("is-overlay-open");

		if (elements.overlayFrame) {
			elements.overlayFrame.focus({ preventScroll: true });
		}

		if (name === "breathe") {
			resetBreathing();
		}

		if (name === "words") {
			renderQuoteList();
		}
	}

	function closeOverlay() {
		if (!elements.overlay || !overlayOpen || closingOverlay) {
			return;
		}

		closingOverlay = true;
		elements.overlay.classList.remove("is-open");
		overlayOpen = false;
		document.body.classList.remove("is-overlay-open");
		stopBreathing(true);

		window.setTimeout(function () {
			elements.overlay.hidden = true;
			elements.overlay.removeAttribute("data-active-panel");
			elements.panels.forEach(function (item) {
				item.hidden = true;
			});
			closingOverlay = false;
		}, reduceMotion ? 0 : 360);

		if (lastFocused && typeof lastFocused.focus === "function") {
			lastFocused.focus({ preventScroll: true });
		}
	}

	function initOverlay() {
		if (!elements.overlay) {
			return;
		}

		document.querySelectorAll("[data-open]").forEach(function (button) {
			button.addEventListener("click", function () {
				openOverlay(button.getAttribute("data-open"));
			});
		});

		elements.overlay.querySelectorAll("[data-overlay-close]").forEach(function (node) {
			node.addEventListener("click", closeOverlay);
		});

		document.addEventListener("keydown", function (event) {
			if (event.key === "Escape" || event.key === "Esc") {
				if (overlayOpen) {
					event.preventDefault();
					closeOverlay();
				}
				return;
			}

			if (!overlayOpen) {
				return;
			}

			if (event.key !== "Tab" || !elements.overlayFrame) {
				return;
			}

			var nodes = focusableInside(elements.overlayFrame);
			if (!nodes.length) {
				return;
			}

			var first = nodes[0];
			var last = nodes[nodes.length - 1];

			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		});
	}

	/* ------------------------------------------------------------- breathing */

	var breathing = {
		timer: 0,
		running: false,
		phase: 0,
		phaseElapsed: 0,
		lastFrame: 0,
		breaths: 0,
		started: false,
	};

	var BREATH_PATTERN = [
		{ key: "breathe.in", seconds: 4, from: 0.55, to: 1.0 },
		{ key: "breathe.hold", seconds: 2, from: 1.0, to: 1.0 },
		{ key: "breathe.out", seconds: 6, from: 1.0, to: 0.55 },
	];

	var breatheNode = {
		orb: document.querySelector("[data-breathe-orb]"),
		phase: document.querySelector("[data-breathe-phase]"),
		count: document.querySelector("[data-breathe-count]"),
		toggle: document.querySelector("[data-breathe-toggle]"),
		toggleLabel: document.querySelector("[data-breathe-toggle-label]"),
		breaths: document.querySelector("[data-breathe-breaths]"),
	};

	function easeInOut(value) {
		return value < 0.5 ? 2 * value * value : 1 - Math.pow(-2 * value + 2, 2) / 2;
	}

	function paintBreathePhase() {
		var stage = BREATH_PATTERN[breathing.phase];

		if (breatheNode.phase) {
			breatheNode.phase.textContent = i18n.t(stage.key);
		}

		var remaining = Math.max(1, Math.ceil(stage.seconds - breathing.phaseElapsed));

		if (breatheNode.count) {
			breatheNode.count.textContent = String(remaining);
		}

		var progress = Math.min(1, breathing.phaseElapsed / stage.seconds);
		var eased = easeInOut(progress);
		var scale = stage.from + (stage.to - stage.from) * eased;

		if (breatheNode.orb) {
			breatheNode.orb.style.setProperty("--orb-scale", scale.toFixed(3));
		}
	}

	function breatheTick(timestamp) {
		if (!breathing.running) {
			return;
		}

		if (!breathing.lastFrame) {
			breathing.lastFrame = timestamp;
		}

		var delta = Math.min(0.1, (timestamp - breathing.lastFrame) / 1000);
		breathing.lastFrame = timestamp;
		breathing.phaseElapsed += delta;

		var stage = BREATH_PATTERN[breathing.phase];

		if (breathing.phaseElapsed >= stage.seconds) {
			breathing.phaseElapsed = 0;
			breathing.phase = (breathing.phase + 1) % BREATH_PATTERN.length;

			if (breathing.phase === 0) {
				breathing.breaths += 1;
				if (breatheNode.breaths) {
					breatheNode.breaths.textContent = String(breathing.breaths);
				}
			}
		}

		paintBreathePhase();
		breathing.timer = window.requestAnimationFrame(breatheTick);
	}

	function startBreathing() {
		if (breathing.running) {
			return;
		}

		breathing.running = true;
		breathing.started = true;
		breathing.lastFrame = 0;
		breathing.timer = window.requestAnimationFrame(breatheTick);

		if (breatheNode.toggleLabel) {
			breatheNode.toggleLabel.textContent = i18n.t("breathe.pause");
		}
	}

	function stopBreathing(reset) {
		breathing.running = false;
		window.cancelAnimationFrame(breathing.timer);
		breathing.lastFrame = 0;

		if (reset) {
			resetBreathing();
			return;
		}

		if (breatheNode.toggleLabel) {
			breatheNode.toggleLabel.textContent = i18n.t(
				breathing.started ? "breathe.resume" : "breathe.start"
			);
		}
	}

	function resetBreathing() {
		breathing.running = false;
		breathing.started = false;
		breathing.phase = 0;
		breathing.phaseElapsed = 0;
		breathing.breaths = 0;
		breathing.lastFrame = 0;
		window.cancelAnimationFrame(breathing.timer);

		if (breatheNode.toggleLabel) {
			breatheNode.toggleLabel.textContent = i18n.t("breathe.start");
		}

		if (breatheNode.breaths) {
			breatheNode.breaths.textContent = "0";
		}

		if (breatheNode.phase) {
			breatheNode.phase.textContent = i18n.t("breathe.in");
		}

		if (breatheNode.count) {
			breatheNode.count.textContent = "4";
		}

		if (breatheNode.orb) {
			breatheNode.orb.style.setProperty("--orb-scale", "0.55");
		}
	}

	function initBreathing() {
		if (!breatheNode.toggle) {
			return;
		}

		breatheNode.toggle.addEventListener("click", function () {
			if (breathing.running) {
				stopBreathing(false);
			} else {
				startBreathing();
			}
		});

		resetBreathing();
	}

	/* ----------------------------------------------------------------- theme */

	var THEME_KEY = "phuoc.theme";
	var THEME_COLOR = { light: "#f4f6ef", dark: "#070b0a" };

	function currentTheme() {
		return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
	}

	function paintThemeLabel() {
		if (!elements.themeButton || !elements.themeLabel) {
			return;
		}

		var theme = currentTheme();
		elements.themeLabel.textContent = i18n.t("theme." + theme);
		elements.themeButton.setAttribute(
			"aria-label",
			i18n.t("controls.theme") + " — " + i18n.t("theme." + theme)
		);
	}

	function applyTheme(theme) {
		document.documentElement.setAttribute("data-theme", theme);

		try {
			window.localStorage.setItem(THEME_KEY, theme);
		} catch (error) {
			/* localStorage bị chặn: vẫn đổi giao diện cho phiên này. */
		}

		var meta = document.querySelector('meta[name="theme-color"]');
		if (meta) {
			meta.setAttribute("content", THEME_COLOR[theme] || THEME_COLOR.light);
		}

		scene.setTheme(theme);
		paintThemeLabel();
	}

	function initTheme() {
		paintThemeLabel();

		if (!elements.themeButton) {
			return;
		}

		elements.themeButton.addEventListener("click", function () {
			applyTheme(currentTheme() === "light" ? "dark" : "light");
		});
	}

	/* --------------------------------------------------------------- effects */

	function paintEffectLabel() {
		if (!elements.effectButton || !elements.effectLabel) {
			return;
		}

		var mode = scene.getMode();
		elements.effectLabel.textContent = i18n.t("effect." + mode);
		elements.effectButton.setAttribute(
			"aria-label",
			i18n.t("controls.effect") + " — " + i18n.t("effect." + mode)
		);
	}

	function initEffects() {
		if (!elements.effectButton) {
			return;
		}

		scene.init();
		scene.on(paintEffectLabel);
		paintEffectLabel();

		elements.effectButton.addEventListener("click", function () {
			scene.cycleMode();
		});
	}

	/* ------------------------------------------------------------ keyboard */

	function initKeyboard() {
		document.addEventListener("keydown", function (event) {
			if (event.defaultPrevented || overlayOpen) {
				return;
			}

			var tag = (event.target && event.target.tagName) || "";

			if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag)) {
				return;
			}

			if (event.key === "ArrowRight") {
				event.preventDefault();
				stepQuote(1);
			} else if (event.key === "ArrowLeft") {
				event.preventDefault();
				stepQuote(-1);
			} else if (event.key === " " && (tag === "BODY" || !tag)) {
				event.preventDefault();
				openOverlay("breathe");
			}
		});
	}

	/* ------------------------------------------------------------------ i18n */

	function paintYear() {
		document.querySelectorAll("[data-current-year]").forEach(function (node) {
			node.textContent = String(new Date().getFullYear());
		});
	}

	function onLanguageChange() {
		paintQuote(true);
		renderQuoteList();
		paintEffectLabel();
		paintThemeLabel();

		if (!breathing.running) {
			if (breatheNode.phase) {
				breatheNode.phase.textContent = i18n.t(BREATH_PATTERN[breathing.phase].key);
			}
			if (breatheNode.toggleLabel) {
				breatheNode.toggleLabel.textContent = i18n.t(
					breathing.started ? "breathe.resume" : "breathe.start"
				);
			}
		}
	}

	/* ------------------------------------------------------------------ boot */

	function boot() {
		i18n.init();
		initIntro();
		paintYear();
		paintQuote(true);
		renderQuoteList();
		restartQuoteTimer();
		initOverlay();
		initBreathing();
		initEffects();
		initTheme();
		initKeyboard();
		i18n.on(onLanguageChange);
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", boot);
	} else {
		boot();
	}
})(window, document);
