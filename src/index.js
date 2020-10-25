import GLTFLoader from './loader/GLTFLoader';
import StandardShader from './shader/standard';
import Input from './input';

// const { glMatrix } = require('gl-matrix');

// TODO: 这个是需要全局设置？
// glMatrix.setMatrixArrayType(Array);

export default class Showcase {
  /**
   * constructor
   * @param {HTMLCanvasElement} canvas 3D continer
   * @param {Scene} scene
   * @param {Object} sceneSetting
   */
  constructor({
    canvas,
    scene,
    sceneSetting,
  }) {
    // TODO: valiator params
    this.canvas = canvas;
    this.$sceneSetting = sceneSetting;
    this.$scene = scene;
    this.$gl = canvas.getContext('webgl2');
    this.$input = new Input({ canvas });
    // eslint-disable-next-line
    canvas.$showcaseInput = this.$input;
    // 可以的shaders列表
    this.$shaders = [new StandardShader({ gl: this.$gl })];
  }

  /**
   * 这个仅用于测试，还有很多问题要解决
   * 问题2：多shader模式下的渲染
   */
  draw() {
    const shader = this.$shaders[0];
    shader.draw(this.$scene);
  }
}

Showcase.GLTFLoader = GLTFLoader;
