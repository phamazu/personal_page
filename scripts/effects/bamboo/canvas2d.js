/*
Bản dự phòng Canvas 2D cho máy không có WebGL (hoặc khi người dùng chọn chế độ "nhẹ").
Vẽ ít lá hơn, mỗi lá là một đường bezier kèm gân giữa, chuyển động cập nhật trên CPU.
*/
(function (window) {
	"use strict";

	var config = window.BambooConfig;

	function drawLeafPath(context) {
		context.beginPath();
		context.moveTo(0, 1);
		context.bezierCurveTo(0.5, 0.62, 0.62, -0.4, 0, -1);
		context.bezierCurveTo(-0.62, -0.4, -0.5, 0.62, 0, 1);
		context.closePath();
	}

	function drawRib(context) {
		context.beginPath();
		context.moveTo(0, 0.9);
		context.quadraticCurveTo(0.05, 0, 0, -0.82);
		context.stroke();
	}

	function toCss(color, alpha) {
		return (
			"rgba(" +
			Math.round(color[0] * 255) +
			", " +
			Math.round(color[1] * 255) +
			", " +
			Math.round(color[2] * 255) +
			", " +
			alpha +
			")"
		);
	}

	/*
	Một gradient dùng chung, toạ độ đơn vị: mọi lá chỉ cần scale hệ trục.
	Nhờ vậy không phải tạo lại gradient mỗi khung hình.
	Dựng từ bảng màu đang dùng nên đổi giao diện là đổi theo.
	*/
	function createGradient(context, palette) {
		var gradient = context.createLinearGradient(0, -1, 0, 1);
		gradient.addColorStop(0, toCss(palette.pale, 0.96));
		gradient.addColorStop(0.5, toCss(palette.leaf, 0.92));
		gradient.addColorStop(1, toCss(palette.shade, 0.86));
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

		var count = settings.count || config.canvas2d.count.desktop;
		var motion = config.canvas2d;
		var gradient = createGradient(context, config.color);
		var ribColor = toCss(config.color.pale, 0.55);
		var leaves = [];
		var width = 1;
		var height = 1;
		var scale = 1;
		var lastTime = 0;

		function spawn(leaf, initial) {
			leaf.size = Math.random() * (motion.size[1] - motion.size[0]) + motion.size[0];
			leaf.baseX = Math.random() * width;
			leaf.x = leaf.baseX;
			leaf.y = initial ? Math.random() * height : -leaf.size * 2;
			leaf.rotation = Math.random() * Math.PI * 2;
			leaf.spin = Math.random() * (motion.spin[1] - motion.spin[0]) + motion.spin[0];
			leaf.swayPhase = Math.random() * Math.PI * 2;
			leaf.swaySpeed = Math.random() * 0.5 + 0.2;
			leaf.swayAmplitude = Math.random() * motion.swayAmplitude + 10;
			leaf.fall = Math.random() * (motion.fall[1] - motion.fall[0]) + motion.fall[0];
			leaf.alpha = Math.random() * (motion.alpha[1] - motion.alpha[0]) + motion.alpha[0];
			leaf.tumblePhase = Math.random() * Math.PI * 2;
			leaf.depth = Math.random();
		}

		function resize(nextWidth, nextHeight) {
			width = nextWidth;
			height = nextHeight;
			scale = Math.min(1.5, Math.max(0.65, Math.min(width, height) / 820));

			if (leaves.length !== count) {
				leaves = [];
				for (var index = 0; index < count; index += 1) {
					var leaf = {};
					spawn(leaf, true);
					leaves.push(leaf);
				}
			}
		}

		function draw(time) {
			var delta = Math.min(0.05, Math.max(0, time - lastTime));
			lastTime = time;

			context.clearRect(0, 0, width, height);

			for (var index = 0; index < leaves.length; index += 1) {
				var leaf = leaves[index];

				leaf.y += leaf.fall * delta * scale;
				leaf.rotation += leaf.spin * delta;
				leaf.x =
					leaf.baseX +
					Math.sin(time * leaf.swaySpeed + leaf.swayPhase) * leaf.swayAmplitude;

				if (leaf.y > height + leaf.size * 3) {
					spawn(leaf, false);
					leaf.y = -leaf.size * 3;
				}

				if (leaf.x < -leaf.size * 3) {
					leaf.baseX = width + leaf.size;
				} else if (leaf.x > width + leaf.size * 3) {
					leaf.baseX = -leaf.size;
				}

				var squash =
					0.42 + 0.58 * Math.abs(Math.cos(time * 0.7 + leaf.tumblePhase));
				var size = leaf.size * scale * (0.7 + leaf.depth * 0.6);

				context.save();
				context.translate(leaf.x, leaf.y);
				context.rotate(leaf.rotation);
				context.scale(size * squash * motion.aspect, size);
				context.globalAlpha = leaf.alpha * (0.6 + leaf.depth * 0.4);
				context.fillStyle = gradient;
				drawLeafPath(context);
				context.fill();
				context.strokeStyle = ribColor;
				context.lineWidth = 0.035;
				drawRib(context);
				context.restore();
			}
		}

		function setPalette(nextConfig) {
			gradient = createGradient(context, nextConfig.color);
			ribColor = toCss(nextConfig.color.pale, 0.55);
		}

		function dispose() {
			context.clearRect(0, 0, width, height);
			leaves = [];
		}

		return {
			kind: "canvas2d",
			get count() {
				return leaves.length;
			},
			resize: resize,
			draw: draw,
			setPalette: setPalette,
			dispose: dispose,
		};
	}

	window.BambooCanvas2D = {
		create: create,
	};
})(window);
