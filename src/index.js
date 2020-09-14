import { loadModel } from './loader';
import StandardShader from './shader/standard';

export default class Showcase {
  /**
   * constructor
   * @param {HTMLCanvasElement} canvas 3D continer
   * @param {Model} model model file
   * @param {Object} sceneSetting
   */
  constructor({
    canvas,
    scene,
    sceneSetting,
  } = {}) {
    // TODO: valiator params
    this.canvas = canvas;
    this.$sceneSetting = sceneSetting;
    this.$scene = scene;
    this.$gl = canvas.getContext('webgl2');
    // 可以的shaders列表
    this.$shaders = [new StandardShader(this.$gl)];
  }

  /**
   * 这个仅用于测试，还有很多问题要解决
   * 问题1: 多个游戏对象需要合并数据一次性写入显存
   * 问题2：多shader模式下的渲染
   */
  // eslint-disable-next-line
  draw() {
    const shader = this.$shaders[0];
    shader.setGpuData(this.$scene.gameObjects[0]);
    requestAnimationFrame(() => {
      shader.draw();
    });
    // const gl = this.$gl;
    // const vertices = [
    //   -0.5, -0.5, 0.0, // let
    //   0.5, -0.5, 0.0, // right
    //   0.0, 0.5, 0.0,
    // ];
    // const VAO = gl.createVertexArray();
    // gl.bindVertexArray(VAO);

    // const VBO = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
    // gl.bufferData(
    //   gl.ARRAY_BUFFER,
    //   new Float32Array(vertices),
    //   gl.STATIC_DRAW,
    // );
    // gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0);
    // gl.enableVertexAttribArray(0);
    // requestAnimationFrame(() => {
    //   gl.clearColor(0.2, 0.3, 0.3, 1.0);
    //   gl.clear(gl.COLOR_BUFFER_BIT);
    //   gl.useProgram(this.$shaders[0].$shaderProgram);
    //   gl.bindVertexArray(VAO);
    //   gl.drawArrays(gl.TRIANGLES, 0, 3);
    // });
  }

  static async loadModel(...args) {
    const scene = await loadModel(...args);
    return scene;
  }
}
