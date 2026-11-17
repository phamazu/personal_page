/*
Chuyển đổi song ngữ Việt / Anh.
- Gắn chuỗi vào mọi phần tử có [data-i18n] và [data-i18n-aria-label].
- Cập nhật <html lang>, tiêu đề tab và meta description.
- Ghi nhớ lựa chọn trong localStorage.
- Phát sự kiện "i18n:change" để các module khác (câu nói, canvas...) cập nhật theo.
*/
(function (window, document) {
	"use strict";

	var STORAGE_KEY = "phuoc.lang";
	var LANGUAGES = ["vi", "en"];
	var content = window.SITE_CONTENT;
	var current = "vi";
	var listeners = [];

	function readStorage() {
		try {
			return window.localStorage.getItem(STORAGE_KEY);
		} catch (error) {
			return null;
		}
	}

	function writeStorage(value) {
		try {
			window.localStorage.setItem(STORAGE_KEY, value);
		} catch (error) {
			/* Chế độ riêng tư chặn localStorage — bỏ qua, không cần báo lỗi. */
		}
	}

	function detect() {
		var saved = readStorage();
		if (saved && LANGUAGES.indexOf(saved) !== -1) {
			return saved;
		}

		/* Mặc định tiếng Việt; chỉ đổi khi người xem đã chọn hoặc trình duyệt là tiếng Anh. */
		var preferred = (window.navigator.language || "vi").slice(0, 2).toLowerCase();
		return preferred === "en" ? "en" : "vi";
	}

	function getStrings() {
		return content.ui[current] || content.ui.vi;
	}

	function t(key) {
		var strings = getStrings();
		return Object.prototype.hasOwnProperty.call(strings, key) ? strings[key] : key;
	}

	function apply(lang) {
		if (LANGUAGES.indexOf(lang) === -1) {
			return;
		}

		current = lang;
		var meta = content.meta[lang] || content.meta.vi;
		var strings = getStrings();
		var root = document.documentElement;

		root.lang = meta.lang;
		root.setAttribute("data-lang", lang);
		document.title = meta.title;

		var description = document.querySelector('meta[name="description"]');
		if (description) {
			description.setAttribute("content", meta.description);
		}

		document.querySelectorAll("[data-i18n]").forEach(function (node) {
			var key = node.getAttribute("data-i18n");
			if (Object.prototype.hasOwnProperty.call(strings, key)) {
				node.textContent = strings[key];
			}
		});

		document.querySelectorAll("[data-i18n-aria-label]").forEach(function (node) {
			var key = node.getAttribute("data-i18n-aria-label");
			if (Object.prototype.hasOwnProperty.call(strings, key)) {
				node.setAttribute("aria-label", strings[key]);
			}
		});

		var label = document.querySelector("[data-lang-toggle]");
		if (label) {
			label.setAttribute("aria-label", lang === "vi" ? "Chuyển sang English" : "Switch to Tiếng Việt");
		}

		writeStorage(lang);

		listeners.forEach(function (callback) {
			callback(lang);
		});

		document.dispatchEvent(
			new window.CustomEvent("i18n:change", { detail: { lang: lang } })
		);
	}

	function set(lang) {
		if (lang === current) {
			return;
		}
		apply(lang);
	}

	function toggle() {
		apply(current === "vi" ? "en" : "vi");
	}

	function on(callback) {
		listeners.push(callback);
		return function unsubscribe() {
			listeners = listeners.filter(function (item) {
				return item !== callback;
			});
		};
	}

	function init() {
		apply(detect());

		var button = document.querySelector("[data-lang-toggle]");
		if (button) {
			button.addEventListener("click", toggle);
		}

		document.documentElement.setAttribute("data-i18n-ready", "");
	}

	window.AppI18n = {
		init: init,
		t: t,
		on: on,
		get: function () {
			return current;
		},
		set: set,
		toggle: toggle,
		quotes: function () {
			return content.quotes[current] || content.quotes.vi;
		},
	};
})(window, document);
