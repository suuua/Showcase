/**
 * 用于创建保存一些 渲染数据
 */

class CommonShaderData {
  constructor() {
    this.$plain = null;
  }

  /**
   * 一个绘制平面
   */
  getPlain(gl) {
    if (!this.$plain) {
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

      const VAO = gl.createVertexArray();
      const VBO = gl.createBuffer();
      gl.bindVertexArray(VAO);
      gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
      gl.bufferData(gl.ARRAY_BUFFER, VBOdata, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 5 * 4, 0);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 5 * 4, 3 * 4);

      gl.bindBuffer(gl.ARRAY_BUFFER, null);
      gl.bindVertexArray(null);
      this.$plain = VAO;
    }
    return this.$plain;
  }
}

export default new CommonShaderData();
