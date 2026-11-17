/*
Cấu hình cảnh hoa anh đào.
Mọi hằng số ảnh hưởng tới hình ảnh nằm ở đây để chỉnh một chỗ là đổi cả cảnh.
Đơn vị: trục z hướng về phía người xem, camera đặt tại z = camera.position.
*/
(function (window) {
	"use strict";

	window.SakuraConfig = {
		canvasId: "sakura",

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

		/* Độ sâu thế giới: cánh hoa rải từ gần tới xa. */
		depth: {
			min: -34,
			max: 42,
		},

		/* Độ nét: mặt phẳng lấy nét và biên độ nhoè. */
		depthOfField: {
			focus: 96,
			range: 82,
			softnessNear: 0.028,
			softnessFar: 0.26,
			alphaNear: 1.0,
			alphaFar: 0.8,
			scaleFar: 1.3,
		},

		motion: {
			fall: [1.8, 4.6],
			drift: 1.0,
			swayAmplitude: 1.3,
			swayFrequency: 0.45,
			spin: [0.25, 0.85],
		},

		petals: {
			size: [0.5, 1.85],
			count: {
				webgl: { desktop: 280, mobile: 150 },
				light: { desktop: 160, mobile: 100 },
			},
		},

		color: {
			light: [1.0, 0.925, 0.949],
			pink: [1.0, 0.663, 0.769],
			deep: [0.98, 0.494, 0.62],
		},

		/* Giới hạn chất lượng. */
		quality: {
			maxDpr: 2,
			mobileBreakpoint: 860,
		},

		/* Bản Canvas 2D dự phòng. */
		canvas2d: {
			count: { desktop: 110, mobile: 60 },
			alpha: [0.3, 0.72],
			swayAmplitude: 26,
			swayFrequency: 0.5,
			fall: [14, 42],
			spin: [-0.5, 0.5],
			size: [7, 20],
		},
	};
})(window);
