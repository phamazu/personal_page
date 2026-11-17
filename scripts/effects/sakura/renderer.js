/*
Renderer WebGL: một lượt vẽ duy nhất cho toàn bộ cánh hoa.
- Dữ liệu tĩnh (seed) nạp một lần; mỗi khung hình chỉ cập nhật uTime.
- Sắp xếp cánh hoa theo trục z trước khi nạp để lớp xa luôn vẽ trước lớp gần.
- Toàn bộ phép tính chuyển động nằm trong vertex shader nên CPU gần như rảnh.
*/
(function (window) {
	"use strict";

	var config = window.SakuraConfig;
	var math = window.SakuraMath;
	var shaders = window.SakuraShaders;
	var utils = window.SakuraGlUtils;

	var UNIFORM_NAMES = [
		"uViewProjection",
		"uTime",
		"uAspect",
		"uTanHalfFov",
		"uCameraZ",
		"uDepthRange",
		"uFallRange",
		"uDrift",
		"uSwayAmplitude",
		"uSwayFrequency",
		"uSpinRange",
		"uSizeRange",
		"uFocus",
		"uDofRange",
		"uSoftNear",
		"uSoftFar",
		"uAlphaNear",
		"uAlphaFar",
		"uScaleFar",
		"uColorLight",
		"uColorPink",
		"uColorDeep",
	];

	var FLOATS_PER_VERTEX = 10;
	var FLOATS_PER_PETAL = 6 * FLOATS_PER_VERTEX;

	var CORNERS = [
		[-1, -1],
		[1, -1],
		[-1, 1],
		[-1, 1],
		[1, -1],
		[1, 1],
	];

	function buildGeometry(count) {
		var petals = [];
		var index;

		for (index = 0; index < count; index += 1) {
			petals.push({
				seedX: Math.random() * 2 - 1,
				seedY: Math.random() * 2 - 1,
				seedZ: Math.random(),
				seedW: Math.random(),
				randX: Math.random(),
				randY: Math.random(),
				randZ: Math.random(),
				randW: Math.random(),
			});
		}

		/* z nhỏ = xa camera ⇒ vẽ trước. */
		petals.sort(function (a, b) {
			return a.seedZ - b.seedZ;
		});

		var data = new Float32Array(petals.length * FLOATS_PER_PETAL);
		var offset = 0;

		for (index = 0; index < petals.length; index += 1) {
			var petal = petals[index];

			for (var cornerIndex = 0; cornerIndex < CORNERS.length; cornerIndex += 1) {
				var corner = CORNERS[cornerIndex];

				data[offset] = corner[0];
				data[offset + 1] = corner[1];
				data[offset + 2] = petal.seedX;
				data[offset + 3] = petal.seedY;
				data[offset + 4] = petal.seedZ;
				data[offset + 5] = petal.seedW;
				data[offset + 6] = petal.randX;
				data[offset + 7] = petal.randY;
				data[offset + 8] = petal.randZ;
				data[offset + 9] = petal.randW;

				offset += FLOATS_PER_VERTEX;
			}
		}

		return data;
	}

	function create(canvas, options) {
		var settings = options || {};

		if (!canvas) {
			return null;
		}

		var gl = utils.createContext(canvas, config.contextAttributes);
		if (!gl) {
			return null;
		}

		var program = utils.createProgram(gl, shaders.vertex, shaders.fragment);
		if (!program) {
			return null;
		}

		var count = settings.count || 900;
		var geometry = buildGeometry(count);
		var buffer = gl.createBuffer();

		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ARRAY_BUFFER, geometry, gl.STATIC_DRAW);

		var attributes = {
			aCorner: gl.getAttribLocation(program, "aCorner"),
			aSeed: gl.getAttribLocation(program, "aSeed"),
			aRand: gl.getAttribLocation(program, "aRand"),
		};

		var uniforms = utils.getUniforms(gl, program, UNIFORM_NAMES);

		var stride = FLOATS_PER_VERTEX * 4;
		var projection = math.mat4.create();
		var view = math.mat4.create();
		var viewProjection = math.mat4.create();
		var tanHalfFov = Math.tan((config.camera.fov * Math.PI) / 360);

		var state = {
			time: 0,
			aspect: 1,
			lost: false,
		};

		math.mat4.lookAt(
			view,
			config.camera.position,
			config.camera.target,
			[0, 1, 0]
		);

		function resize(width, height) {
			state.aspect = width / Math.max(height, 1);

			math.mat4.perspective(
				projection,
				(config.camera.fov * Math.PI) / 180,
				state.aspect,
				config.camera.near,
				config.camera.far
			);

			math.mat4.multiply(viewProjection, projection, view);
		}

		function applyStaticUniforms() {
			gl.uniformMatrix4fv(uniforms.uViewProjection, false, viewProjection);
			gl.uniform1f(uniforms.uTanHalfFov, tanHalfFov);
			gl.uniform1f(uniforms.uCameraZ, config.camera.position[2]);
			gl.uniform2f(uniforms.uDepthRange, config.depth.min, config.depth.max);
			gl.uniform2f(uniforms.uFallRange, config.motion.fall[0], config.motion.fall[1]);
			gl.uniform1f(uniforms.uDrift, config.motion.drift);
			gl.uniform1f(uniforms.uSwayAmplitude, config.motion.swayAmplitude);
			gl.uniform1f(uniforms.uSwayFrequency, config.motion.swayFrequency);
			gl.uniform2f(uniforms.uSpinRange, config.motion.spin[0], config.motion.spin[1]);
			gl.uniform2f(uniforms.uSizeRange, config.petals.size[0], config.petals.size[1]);
			gl.uniform1f(uniforms.uFocus, config.depthOfField.focus);
			gl.uniform1f(uniforms.uDofRange, config.depthOfField.range);
			gl.uniform1f(uniforms.uSoftNear, config.depthOfField.softnessNear);
			gl.uniform1f(uniforms.uSoftFar, config.depthOfField.softnessFar);
			gl.uniform1f(uniforms.uAlphaNear, config.depthOfField.alphaNear);
			gl.uniform1f(uniforms.uAlphaFar, config.depthOfField.alphaFar);
			gl.uniform1f(uniforms.uScaleFar, config.depthOfField.scaleFar);
			gl.uniform3fv(uniforms.uColorLight, config.color.light);
			gl.uniform3fv(uniforms.uColorPink, config.color.pink);
			gl.uniform3fv(uniforms.uColorDeep, config.color.deep);
		}

		function bindAttributes() {
			gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

			gl.enableVertexAttribArray(attributes.aCorner);
			gl.vertexAttribPointer(attributes.aCorner, 2, gl.FLOAT, false, stride, 0);

			gl.enableVertexAttribArray(attributes.aSeed);
			gl.vertexAttribPointer(attributes.aSeed, 4, gl.FLOAT, false, stride, 8);

			gl.enableVertexAttribArray(attributes.aRand);
			gl.vertexAttribPointer(attributes.aRand, 4, gl.FLOAT, false, stride, 24);
		}

		function draw(time) {
			if (state.lost) {
				return;
			}

			state.time = time;

			gl.viewport(0, 0, canvas.width, canvas.height);
			gl.clearColor(0, 0, 0, 0);
			gl.clear(gl.COLOR_BUFFER_BIT);

			gl.enable(gl.BLEND);
			gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
			gl.disable(gl.DEPTH_TEST);

			gl.useProgram(program);
			applyStaticUniforms();
			bindAttributes();

			gl.uniform1f(uniforms.uTime, time);
			gl.uniform1f(uniforms.uAspect, state.aspect);

			gl.drawArrays(gl.TRIANGLES, 0, count * 6);
		}

		function handleContextLost(event) {
			event.preventDefault();
			state.lost = true;
			if (typeof settings.onLost === "function") {
				settings.onLost();
			}
		}

		canvas.addEventListener("webglcontextlost", handleContextLost, false);

		function dispose() {
			canvas.removeEventListener("webglcontextlost", handleContextLost, false);

			gl.deleteBuffer(buffer);
			gl.deleteProgram(program);
		}

		return {
			kind: "webgl",
			count: count,
			resize: resize,
			draw: draw,
			dispose: dispose,
		};
	}

	window.SakuraRenderer = {
		create: create,
	};
})(window);
