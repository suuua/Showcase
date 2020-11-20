import GLTFLoader from './loader/GLTFLoader';
import DefferShading from './shader/deffer';
import DepthShading from './shader/depth';
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
  }

  draw() {
    // draw
    const shading = new DefferShading({ gl: this.$gl });
    shading.draw(this.$scene);
  }
}

Showcase.GLTFLoader = GLTFLoader;
