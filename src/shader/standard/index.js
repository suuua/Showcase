import Shader from '../index';
import vsSource from './vertex.glsl';
import fsSource from './fragment.glsl';

export default class StandardShader extends Shader {
  constructor(gl) {
    super(gl, vsSource, fsSource);
    this.version = '0.0.1';
    // shader 需要的参数
    this.params = {
      vertices: null,
      textures: null,
      indices: null,
    };
    this.drawParams = {};
  }

  setParams(gameObject) {
    Object.keys(this.params).forEach((key) => {
      this.params[key] = gameObject[key];
    });
  }

  setGpuData(gameObject) {
    const gl = this.$gl;
    const VAO = gl.createVertexArray();
    gl.bindVertexArray(VAO);

    const VBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(gameObject.vertices),
      gl.STATIC_DRAW,
    );
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 32, 0);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 32, 12); // 3*4
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 32, 24); // 6*4
    gl.enableVertexAttribArray(2);

    const EBO = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, EBO);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(gameObject.indices),
      gl.STATIC_DRAW,
    );

    const textureSource = gameObject.textures[0];
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGB,
      textureSource.width, textureSource.height,
      0, gl.RGB, gl.UNSIGNED_BYTE,
      textureSource.data,
    );
    // gl.generateMipmap(gl.TEXTURE_2D);
    // set texture wrapping to GL_REPEAT (default wrapping method)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    // set texture filtering parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    this.use();
    gl.uniform1i(gl.getUniformLocation(this.$shaderProgram, 'ourTexture'), 0);
    this.drawParams.VAO = VAO;
    this.drawParams.texture = texture;
  }

  /**
   * 绘制函数，每帧都会渲染一次
   */
  draw() {
    const gl = this.$gl;
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.drawParams.texture);
    this.use();
    gl.bindVertexArray(this.drawParams.VAO);
    /**
     * 这里文档中说使用gl.getExtension('OES_element_index_uint');时必须设置类型为gl.UNSIGNED_INT
     * 另外如果使用UNSIGNED_INT会导致报错“GL_INVALID_OPERATION: Insufficient buffer size.”
     */
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  }
}
