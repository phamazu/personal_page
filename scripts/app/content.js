/*
Toàn bộ nội dung hiển thị của trang.
Muốn đổi tên, câu nói hay lời giới thiệu: chỉ cần sửa file này.
Khoá có dấu chấm (vd. "nav.breathe") được gắn trực tiếp vào thuộc tính data-i18n.
*/
(function (window) {
	"use strict";

	var content = {
		/* Tiêu đề tab, mô tả SEO, thẻ og — đổi theo ngôn ngữ. */
		meta: {
			vi: {
				lang: "vi",
				title: "Phước — Tỉnh thức & Chánh niệm",
				description:
					"Một trang nhỏ để thở. Vài câu nói về tỉnh thức, chánh niệm và sự trở về với giây phút hiện tại.",
			},
			en: {
				lang: "en",
				title: "Phước — Awakening & Mindfulness",
				description:
					"A small page to breathe. A few words on awakening, mindfulness, and returning to this moment.",
			},
		},

		/* Chuỗi giao diện. */
		ui: {
			vi: {
				skipLink: "Tới nội dung",
				eyebrow: "Người thực hành chánh niệm",
				"nav.aria": "Khám phá",
				"nav.breathe": "Thở",
				"nav.words": "Câu nói",
				"nav.about": "Về",
				footerNote: "một trang nhỏ để thở",
				hint: "Phím → đổi câu nói · Space để thở theo nhịp",
				close: "Đóng",

				"controls.effect": "Đổi hiệu ứng cánh hoa",
				"effect.auto": "Hoa",
				"effect.light": "Nhẹ",
				"effect.off": "Tĩnh",

				"breathe.kicker": "Bốn · hai · sáu",
				"breathe.title": "Thở theo nhịp",
				"breathe.start": "Bắt đầu",
				"breathe.resume": "Tiếp tục",
				"breathe.pause": "Tạm dừng",
				"breathe.breaths": "Số nhịp",
				"breathe.in": "Hít vào",
				"breathe.hold": "Giữ",
				"breathe.out": "Thở ra",
				"breathe.note":
					"Ngồi thẳng, vai buông. Không cần làm gì khác ngoài việc theo dõi hơi thở.",

				"words.kicker": "Ghi lại",
				"words.title": "Vài câu nói",
				"words.footnote": "Những câu này không phải để thuộc lòng, chỉ để nhắc.",

				"about.kicker": "Về trang này",
				"about.title": "Một khoảng lặng",
				"about.p1":
					"Đây là một trang rất nhỏ, chỉ để mở ra, thở vài hơi rồi đóng lại. Không có danh sách thành tựu, không có lời chào mời.",
				"about.p2":
					"Tôi chọn không để lại nhiều phương thức liên hệ ở đây, vì trang này không phải là nơi để liên lạc. Nếu duyên đủ, ta sẽ gặp nhau ở một chỗ khác.",
				"about.p3":
					"Hoa anh đào nở rồi rụng. Cánh hoa rơi không vội, cũng không tiếc.",
				"about.footnote":
					"Trang được dựng bằng HTML, CSS và JavaScript thuần — không cần bước build.",
			},

			en: {
				skipLink: "Skip to content",
				eyebrow: "A mindfulness practitioner",
				"nav.aria": "Explore",
				"nav.breathe": "Breathe",
				"nav.words": "Words",
				"nav.about": "About",
				footerNote: "a small page to breathe",
				hint: "→ for the next thought · Space to follow your breath",
				close: "Close",

				"controls.effect": "Change the petal effect",
				"effect.auto": "Bloom",
				"effect.light": "Light",
				"effect.off": "Still",

				"breathe.kicker": "Four · two · six",
				"breathe.title": "Paced breathing",
				"breathe.start": "Begin",
				"breathe.resume": "Resume",
				"breathe.pause": "Pause",
				"breathe.breaths": "Breaths",
				"breathe.in": "Breathe in",
				"breathe.hold": "Hold",
				"breathe.out": "Breathe out",
				"breathe.note":
					"Sit tall, let the shoulders drop. There is nothing to do but follow the breath.",

				"words.kicker": "Written down",
				"words.title": "A few words",
				"words.footnote": "These are not meant to be memorised, only remembered.",

				"about.kicker": "About this page",
				"about.title": "A little quiet",
				"about.p1":
					"This is a very small page: you open it, take a few breaths, and close it. No list of achievements, no pitch.",
				"about.p2":
					"I have chosen to leave few ways of reaching me here, because this page is not a place for contact. If the conditions are right, we will meet somewhere else.",
				"about.p3":
					"Cherry blossoms open, then fall. The petal falls without hurry, and without regret.",
				"about.footnote":
					"Built with plain HTML, CSS and JavaScript — no build step required.",
			},
		},

		/* Câu nói xoay vòng ở giữa trang và hiện đầy đủ trong bảng "Câu nói". */
		quotes: {
			vi: [
				"Thở vào. Thở ra. Có mặt.",
				"Tỉnh thức không phải là đi đâu xa — mà là trở về với hơi thở này.",
				"Tâm như mặt hồ: lặng thì thấy đáy, động thì chỉ thấy sóng.",
				"Không phải chuyện gì cũng cần phản ứng. Có những lúc chỉ cần quan sát.",
				"Cánh hoa rơi không vội, cũng không tiếc.",
				"Hạnh phúc không ở cuối đường, nó ở từng bước chân.",
				"Buông không phải là mất — mà là nhẹ.",
			],
			en: [
				"Breathe in. Breathe out. Be here.",
				"Awakening is not a journey elsewhere — it is a return to this breath.",
				"The mind is a lake: still, it shows the depths; stirred, it shows only waves.",
				"Not everything needs a reaction. Sometimes simply watching is enough.",
				"The petal falls without hurry, and without regret.",
				"Happiness is not at the end of the road; it is in each step.",
				"Letting go is not losing — it is becoming light.",
			],
		},
	};

	window.SITE_CONTENT = content;
})(window);
