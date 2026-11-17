/*
Cấu hình cảnh lá trúc rơi.
Mọi hằng số ảnh hưởng tới hình ảnh nằm ở đây để chỉnh một chỗ là đổi cả cảnh.
Đơn vị: trục z hướng về phía người xem, camera đặt tại z = camera.position.

Ghi chú về hình lá: mỗi lá là một quad vuông được ép hẹp theo trục x bởi
leaves.aspect. Hàm khoảng cách trong shaders.js vẽ hình lá trong toạ độ UV
[-1, 1] × [-1, 1], nên tỉ lệ dài/rộng thực tế = (2 × bề rộng UV) × aspect.
*/
(function (window) {
	"use strict";

	window.BambooConfig = {
		canvasId: "bamboo",

		/* Ngữ cảnh WebGL. */
		contextAttributes: {
			alpha: true,
			antialias: true,
			depth: false,
			premultipliedAlpha: false,
			preserveDrawingBuffer: false,
			powerPreference: "high-performance",
			stencil: false,
		},

		camera: {
			fov: 55,
			near: 1,
			far: 220,
			position: [0, 0, 96],
			target: [0, 0, 0],
		},

		/* Độ sâu thế giới: lá rải từ gần tới xa. */
		depth: {
			min: -34,
			max: 42,
		},

		/* Độ nét: mặt phẳng lấy nét và biên độ nhoè. */
		depthOfField: {
			focus: 96,
			range: 82,
			softnessNear: 0.026,
			softnessFar: 0.24,
			alphaNear: 1.0,
			alphaFar: 0.8,
			scaleFar: 1.28,
		},

		/*
		Lá trúc rơi chậm và đong đưa rộng hơn cánh hoa: biên độ đung đưa lớn,
		tần số thấp, xoay chậm, trôi ngang rõ hơn.
		*/
		motion: {
			fall: [1.5, 3.9],
			drift: 1.7,
			swayAmplitude: 2.6,
			swayFrequency: 0.36,
			spin: [0.16, 0.55],
		},

		leaves: {
			size: [1.7, 4.0],
			aspect: 0.3,
			count: {
				webgl: { desktop: 105, mobile: 70 },
				light: { desktop: 90, mobile: 60 },
			},
		},

		/* Ba màu pha trên phiến lá. */
		color: {
			pale: [0.902, 0.988, 0.878],
			leaf: [0.51, 0.855, 0.6],
			shade: [0.169, 0.494, 0.318],
		},

		/* Giới hạn chất lượng. */
		quality: {
			maxDpr: 2,
			mobileBreakpoint: 860,
		},

		/* Bản Canvas 2D dự phòng. */
		canvas2d: {
			count: { desktop: 80, mobile: 48 },
			aspect: 0.36,
			alpha: [0.42, 0.86],
			swayAmplitude: 34,
			swayFrequency: 0.4,
			fall: [11, 30],
			spin: [-0.6, 0.6],
			size: [16, 40],
		},
	};
})(window);
