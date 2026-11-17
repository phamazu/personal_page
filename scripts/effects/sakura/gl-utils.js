/*
Tiện ích WebGL: tạo ngữ cảnh, biên dịch shader, tạo chương trình.
Mọi lỗi biên dịch đều được ghi ra console kèm số dòng để dễ sửa shader.
*/
(function (window) {
	"use strict";

	function createContext(canvas, attributes) {
		var names = ["webgl2", "webgl", "experimental-webgl"];

		for (var index = 0; index < names.length; index += 1) {
			try {
				var context = canvas.getContext(names[index], attributes);
				if (context) {
					return context;
				}
			} catch (error) {
				/* Thử tên ngữ cảnh tiếp theo. */
			}
		}

		return null;
	}

	function compile(gl, type, source) {
		var shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			var kind = type === gl.VERTEX_SHADER ? "vertex" : "fragment";
			var log = gl.getShaderInfoLog(shader);
			window.console.error("[sakura] Không biên dịch được shader " + kind + ":\n" + log);
			gl.deleteShader(shader);
			return null;
		}

		return shader;
	}

	function createProgram(gl, vertexSource, fragmentSource) {
		var vertexShader = compile(gl, gl.VERTEX_SHADER, vertexSource);
		var fragmentShader = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);

		if (!vertexShader || !fragmentShader) {
			return null;
		}

		var program = gl.createProgram();
		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);

		gl.deleteShader(vertexShader);
		gl.deleteShader(fragmentShader);

		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			window.console.error("[sakura] Không link được chương trình:", gl.getProgramInfoLog(program));
			gl.deleteProgram(program);
			return null;
		}

		return program;
	}

	function getUniforms(gl, program, names) {
		return names.reduce(function (accumulator, name) {
			accumulator[name] = gl.getUniformLocation(program, name);
			return accumulator;
		}, {});
	}

	window.SakuraGlUtils = {
		createContext: createContext,
		createProgram: createProgram,
		getUniforms: getUniforms,
	};
})(window);
