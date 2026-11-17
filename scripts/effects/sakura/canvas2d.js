/*
Bản dự phòng Canvas 2D cho máy không có WebGL (hoặc khi người dùng chọn chế độ "nhẹ").
Vẽ ít cánh hoa hơn, mỗi cánh là một đường bezier, chuyển động cập nhật trên CPU.
*/
(function (window) {
	"use strict";

	var config = window.SakuraConfig;

	var UNIT_PATH = [
		[0, 1],
		[0.86, 0.52],
		[0.8, -0.72],
		[0.14, -1],
	];

	function buildPath(context) {
		context.beginPath();
		context.moveTo(0, 1);
		context.bezierCurveTo(0.86, 0.52, 0.8, -0.72, 0.16, -1);
		context.lineTo(0, -0.74);
		context.lineTo(-0.16, -1);
		context.bezierCurveTo(-0.8, -0.72, -0.86, 0.52, 0, 1);
		context.closePath();
	}

	/*
	Một gradient dùng chung, toạ độ đơn vị: mọi cánh hoa chỉ cần scale hệ trục.
	Nhờ vậy không phải tạo lại gradient mỗi khung hình.
	*/
	function createGradient(context) {
		var gradient = context.createLinearGradient(0, -1, 0, 1);
		gradient.addColorStop(0, "rgba(255, 245, 249, 0.95)");
		gradient.addColorStop(0.55, "rgba(255, 173, 198, 0.85)");
		gradient.addColorStop(1, "rgba(244, 132, 168, 0.7)");
		return gradient;
	}

	function create(canvas, options) {
		var settings = options || {};

		if (!canvas) {
			return null;
		}

		var context = canvas.getContext("2d");
		if (!context) {
			return null;
		}

		var count = settings.count || 90;
		var gradient = createGradient(context);
		var petals = [];
		var width = 1;
		var height = 1;
		var scale = 1;
		var lastTime = 0;

		function spawn(petal, initial) {
			var motion = config.canvas2d;

			petal.size = Math.random() * (motion.size[1] - motion.size[0]) + motion.size[0];
			petal.baseX = Math.random() * width;
			petal.x = petal.baseX;
			petal.y = initial ? Math.random() * height : -petal.size * 2;
			petal.rotation = Math.random() * Math.PI * 2;
			petal.spin = Math.random() * (motion.spin[1] - motion.spin[0]) + motion.spin[0];
			petal.swayPhase = Math.random() * Math.PI * 2;
			petal.swaySpeed = Math.random() * 0.6 + 0.25;
			petal.swayAmplitude = Math.random() * motion.swayAmplitude + 8;
			petal.fall = Math.random() * (motion.fall[1] - motion.fall[0]) + motion.fall[0];
			petal.alpha = Math.random() * (motion.alpha[1] - motion.alpha[0]) + motion.alpha[0];
			petal.tumblePhase = Math.random() * Math.PI * 2;
			petal.depth = Math.random();
		}

		function resize(nextWidth, nextHeight) {
			width = nextWidth;
			height = nextHeight;
			scale = Math.min(1.5, Math.max(0.65, Math.min(width, height) / 820));

			if (petals.length !== count) {
				petals = [];
				for (var index = 0; index < count; index += 1) {
					var petal = {};
					spawn(petal, true);
					petals.push(petal);
				}
			}
		}

		function draw(time) {
			var delta = Math.min(0.05, Math.max(0, time - lastTime));
			lastTime = time;

			context.clearRect(0, 0, width, height);

			for (var index = 0; index < petals.length; index += 1) {
				var petal = petals[index];

				petal.y += petal.fall * delta * scale;
				petal.rotation += petal.spin * delta;
				petal.x =
					petal.baseX +
					Math.sin(time * petal.swaySpeed + petal.swayPhase) * petal.swayAmplitude;

				if (petal.y > height + petal.size * 3) {
					spawn(petal, false);
					petal.y = -petal.size * 3;
				}

				if (petal.x < -petal.size * 3) {
					petal.baseX = width + petal.size;
				} else if (petal.x > width + petal.size * 3) {
					petal.baseX = -petal.size;
				}

				var squash =
					0.35 + 0.65 * Math.abs(Math.cos(time * 0.8 + petal.tumblePhase));
				var size = petal.size * scale * (0.7 + petal.depth * 0.6);

				context.save();
				context.translate(petal.x, petal.y);
				context.rotate(petal.rotation);
				context.scale(size * squash, size);
				context.globalAlpha = petal.alpha * (0.55 + petal.depth * 0.45);
				context.fillStyle = gradient;
				buildPath(context);
				context.fill();
				context.restore();
			}
		}

		function dispose() {
			context.clearRect(0, 0, width, height);
			petals = [];
		}

		return {
			kind: "canvas2d",
			get count() {
				return petals.length;
			},
			resize: resize,
			draw: draw,
			dispose: dispose,
		};
	}

	window.SakuraCanvas2D = {
		create: create,
	};
})(window);
