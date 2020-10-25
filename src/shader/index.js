import { warn } from '../helper/log';

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

  /**
   * TODO: 用于描述着色器的参数，属性，变量顺序等内容以期望components和shader解耦
   */
  static description() { return Object.create(null); }

  get gl() { return this.$gl; }

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

  createBindVAO() {
    const gl = this.$gl;
    const VAO = gl.createVertexArray();
    gl.bindVertexArray(VAO);
    return VAO;
  }

  createVBO(pointer, info) {
    const gl = this.$gl;
    const VBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      info.typeArray,
      gl.STATIC_DRAW,
    );
    gl.vertexAttribPointer(pointer, info.size, gl[info.type], false, info.stride, 0);
    gl.enableVertexAttribArray(pointer);
    return VBO;
  }

  createEBO(info) {
    const gl = this.$gl;
    const EBO = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, EBO);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      info.typeArray,
      gl.STATIC_DRAW,
    );
    return info;
  }

  createBaseColorTexture(info) {
    const gl = this.$gl;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // set texture wrapping to GL_REPEAT (default wrapping method)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    const { width, height, imgElm } = info;
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      width,
      height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      /**
       * 当使用Uint8Array时，会计算大小 width * height * channel Byte; 但在图片文件中，内容被压缩优化会远远小于这个值，
       * 因此这个值仅用于手动按字节填充颜色值
       */
      imgElm,
    );
    gl.generateMipmap(gl.TEXTURE_2D);

    return texture;
  }

  setInt(name, i) {
    this.$gl.uniform1i(this.$gl.getUniformLocation(this.$shaderProgram, name, name), i);
  }

  setFloat(name, f) {
    this.$gl.uniform1f(this.$gl.getUniformLocation(this.$shaderProgram, name, name), f);
  }

  setVec4(name, vec4) {
    this.$gl.uniform4fv(this.$gl.getUniformLocation(this.$shaderProgram, name, name), vec4);
  }

  setMat4(name, martix) {
    const gl = this.$gl;
    gl.uniformMatrix4fv(gl.getUniformLocation(this.$shaderProgram, name), false, martix);
  }

  setVec3(name, vec3) {
    const gl = this.$gl;
    gl.uniform3fv(gl.getUniformLocation(this.$shaderProgram, name), vec3);
  }
}
