import { warn } from '../helper/log';
/**
 * compile shader
 * @param {WebGL} gl webgl content
 * @param {String} vsSource vertex shader source string
 * @param {String} fsSource fragment shader source string
 */
export default class Shader {
  constructor({ gl, vsSource, fsSource }) {
    this.$gl = gl;
    const vertexShader = this.compileShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fsSource);
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    this.$shaderProgram = shaderProgram;
  }

  compileShader(type, source) {
    const gl = this.$gl;
    const shader = gl.createShader(type);

    // Send the source to the shader object

    gl.shaderSource(shader, source);

    // Compile the shader program

    gl.compileShader(shader);

    // See if it compiled successfully

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      warn(`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`);
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  use() {
    return this.$gl.useProgram(this.$shaderProgram);
  }

  setMat4(name, martix) {
    const gl = this.$gl;
    gl.uniformMatrix4fv(gl.getUniformLocation(this.$shaderProgram, name), false, martix);
  }
}
