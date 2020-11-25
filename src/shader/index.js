import { warn } from '../helper/log';

/**
 * 预编译着色器
 * @param {String} source 着色器原字符
 * @param {Object} predefined 需要替换的预定义变量
 */
function preCompileShader(source, predefined) {
  let result = source;
  Object.entries(predefined).forEach(([key, val]) => {
    // 频繁的赋值常量会导致内存不停的创建/销毁
    result = result.replace(new RegExp(`@${key}`, 'g'), val);
  });
  return result;
}

export default class Shader {
  constructor({
    gl,
    vsSource,
    fsSource,
    autoCompile = true,
  }) {
    this.$gl = gl;
    this.$shaderProgram = null;
    this.vsSource = vsSource;
    this.fsSource = fsSource;
    if (autoCompile) {
      this.compileProgram();
    }
  }

  /**
   * TODO: 用于描述着色器的参数，属性，变量顺序等内容以期望components和shader解耦
   */
  static description() { return Object.create(null); }

  get gl() { return this.$gl; }

  compileProgram(vsSourcePreDefined, fsSourcePredefined) {
    const { vsSource, fsSource, gl } = this;
    const vertexShader = this.compileShader(
      gl.VERTEX_SHADER,
      vsSourcePreDefined ? preCompileShader(vsSource, vsSourcePreDefined) : vsSource,
    );
    const fragmentShader = this.compileShader(
      gl.FRAGMENT_SHADER,
      fsSourcePredefined ? preCompileShader(fsSource, fsSourcePredefined) : fsSource,
    );
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    this.$shaderProgram = shaderProgram;
    this.vsSource = '';
    this.fsSource = '';
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

  createEmptyDepthTexture2D(info) {
    const gl = this.$gl;
    const depthTexture = gl.createTexture();
    const { width, height } = info;
    gl.bindTexture(gl.TEXTURE_2D, depthTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.DEPTH_COMPONENT32F,
      width,
      height,
      0,
      gl.DEPTH_COMPONENT,
      gl.FLOAT,
      null,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.GREATER);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return depthTexture;
  }

  createEmptyColorTexture2D(info) {
    const gl = this.$gl;
    const depthTexture = gl.createTexture();
    const { width, height } = info;
    gl.bindTexture(gl.TEXTURE_2D, depthTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      width,
      height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    return depthTexture;
  }

  createStandardPlainMesh() {
    const gl = this.$gl;
    const sourceData = [
      -1.0, 1.0, 0.0, 0.0, 1.0,
      -1.0, -1.0, 0.0, 0.0, 0.0,
      1.0, 1.0, 0.0, 1.0, 1.0,
      1.0, -1.0, 0.0, 1.0, 0.0,
    ];
    const VBOdata = new Float32Array(sourceData.length);
    for (let i = 0; i < sourceData.length; i += 1) {
      VBOdata[i] = sourceData[i];
    }

    const VAO = this.createBindVAO();
    const VBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
    gl.bufferData(gl.ARRAY_BUFFER, VBOdata, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 5 * 4, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 5 * 4, 3 * 4);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
    return VAO;
  }

  setInt(name, i) {
    this.$gl.uniform1i(this.$gl.getUniformLocation(this.$shaderProgram, name), i);
  }

  setUInt(name, i) {
    this.$gl.uniform1ui(this.$gl.getUniformLocation(this.$shaderProgram, name), i);
  }

  setFloat(name, f) {
    this.$gl.uniform1f(this.$gl.getUniformLocation(this.$shaderProgram, name), f);
  }

  setVec4(name, vec4) {
    this.$gl.uniform4fv(this.$gl.getUniformLocation(this.$shaderProgram, name), vec4);
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
