import Shader from '../index';
import vsSource from './vertex.glsl';
import fsSource from './fragment.glsl';
import DepthShader from '../depth';

export default class StandardShader extends Shader {
  constructor({ gl }) {
    super({ gl, vsSource, fsSource });
    this.version = '0.0.1';
    // shader 需要的参数
    this.params = {
      vertices: null,
      textures: null,
      indices: null,
    };
    this.drawParams = {};

    this.depthShader = new DepthShader({ gl });
  }

  /**
   * 绘制函数，每帧都会渲染一次
   */
  draw(scene) {
    const gl = this.$gl;
    const depthMap = this.depthShader.draw(scene);
    this.use();
    scene.visitor.callHook('onBeforeRender');
    this.createBaseColorTexture('depthMap', depthMap);
    gl.enable(gl.DEPTH_TEST);
    let preFrameTime = +new Date();
    const frame = () => {
      const time = +new Date();
      const deltaTime = (time - preFrameTime) / 1000;
      preFrameTime = time;
      const input = gl.canvas.$showcaseInput.processInput();
      const tar = {
        input,
        deltaTime,
      };
      scene.visitor.callHook('onRenderStart', tar);
      gl.clearColor(0, 0, 0, 1.0);
      // eslint-disable-next-line
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      scene.visitor.callHook('onRender', tar);
      scene.visitor.callHook('onRenderEnd', tar);
      window.requestAnimationFrame(frame);
    };
    window.requestAnimationFrame(frame);
  }
}
