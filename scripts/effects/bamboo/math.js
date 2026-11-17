/*
Toán học tối thiểu cho renderer: ma trận 4x4 và vài hàm tiện ích.
Cố ý giữ phẳng (Float32Array) để chuyển thẳng vào WebGL, không phụ thuộc thư viện ngoài.
*/
(function (window) {
	"use strict";

	var mat4 = {
		create: function () {
			var out = new Float32Array(16);
			out[0] = 1;
			out[5] = 1;
			out[10] = 1;
			out[15] = 1;
			return out;
		},

		perspective: function (out, fovRadians, aspect, near, far) {
			var f = 1.0 / Math.tan(fovRadians / 2);
			var nf = 1.0 / (near - far);

			out[0] = f / aspect;
			out[1] = 0;
			out[2] = 0;
			out[3] = 0;

			out[4] = 0;
			out[5] = f;
			out[6] = 0;
			out[7] = 0;

			out[8] = 0;
			out[9] = 0;
			out[10] = (far + near) * nf;
			out[11] = -1;

			out[12] = 0;
			out[13] = 0;
			out[14] = 2 * far * near * nf;
			out[15] = 0;

			return out;
		},

		lookAt: function (out, eye, target, up) {
			var zx = eye[0] - target[0];
			var zy = eye[1] - target[1];
			var zz = eye[2] - target[2];
			var zLength = Math.sqrt(zx * zx + zy * zy + zz * zz) || 1;

			zx /= zLength;
			zy /= zLength;
			zz /= zLength;

			var xx = up[1] * zz - up[2] * zy;
			var xy = up[2] * zx - up[0] * zz;
			var xz = up[0] * zy - up[1] * zx;
			var xLength = Math.sqrt(xx * xx + xy * xy + xz * xz) || 1;

			xx /= xLength;
			xy /= xLength;
			xz /= xLength;

			var yx = zy * xz - zz * xy;
			var yy = zz * xx - zx * xz;
			var yz = zx * xy - zy * xx;

			out[0] = xx;
			out[1] = yx;
			out[2] = zx;
			out[3] = 0;

			out[4] = xy;
			out[5] = yy;
			out[6] = zy;
			out[7] = 0;

			out[8] = xz;
			out[9] = yz;
			out[10] = zz;
			out[11] = 0;

			out[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2]);
			out[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2]);
			out[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2]);
			out[15] = 1;

			return out;
		},

		multiply: function (out, a, b) {
			var a00 = a[0],
				a01 = a[1],
				a02 = a[2],
				a03 = a[3];
			var a10 = a[4],
				a11 = a[5],
				a12 = a[6],
				a13 = a[7];
			var a20 = a[8],
				a21 = a[9],
				a22 = a[10],
				a23 = a[11];
			var a30 = a[12],
				a31 = a[13],
				a32 = a[14],
				a33 = a[15];

			var b0 = b[0],
				b1 = b[1],
				b2 = b[2],
				b3 = b[3];

			out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
			out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
			out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
			out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

			b0 = b[4];
			b1 = b[5];
			b2 = b[6];
			b3 = b[7];

			out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
			out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
			out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
			out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

			b0 = b[8];
			b1 = b[9];
			b2 = b[10];
			b3 = b[11];

			out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
			out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
			out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
			out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

			b0 = b[12];
			b1 = b[13];
			b2 = b[14];
			b3 = b[15];

			out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
			out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
			out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
			out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

			return out;
		},
	};

	window.BambooMath = {
		mat4: mat4,

		clamp: function (value, min, max) {
			return value < min ? min : value > max ? max : value;
		},

		lerp: function (a, b, t) {
			return a + (b - a) * t;
		},

		random: function (min, max) {
			return min + Math.random() * (max - min);
		},
	};
})(window);
