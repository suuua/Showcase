import GLTFLoader from './loader/GLTFLoader';
import DefferShading from './shader/deffer';
import ShadowShading from './shader/shadow';
import FXAAShader from './shader/postProcessing/fxaa';
import DisplayShader from './shader/display';
import SendGpuDataVisitor from './scene/SendGpuDataVisitor';
import createSceneProxy from './scene/sceneProxy';
import Input from './input';

export default class Showcase {
  /**
   * constructor
   * @param {HTMLCanvasElement} canvas
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
  }

  draw() {
    const gl = this.$gl;
    const SCR_WIDTH = gl.drawingBufferWidth;
    const SCR_HEIGHT = gl.drawingBufferHeight;
    const scene = this.$scene;
    const camera = scene.getCameraComponent();
    camera.aspect = SCR_WIDTH / SCR_HEIGHT;

    const defferShading = new DefferShading({ gl });
    const shadowShading = new ShadowShading({ gl });
    const fxaaShader = new FXAAShader({ gl });
    const displayShader = new DisplayShader({ gl });
    const sendGpuDataVisitor = new SendGpuDataVisitor({ gl, scene });
    const proxy = createSceneProxy(scene, gl);
    // set default gl global status
    gl.enable(gl.DEPTH_TEST);
    scene.callHook('onBeforeRender');
    let preFrameTime = +new Date();
    const frame = () => {
      const time = +new Date();
      const deltaTime = (time - preFrameTime) / 1000;
      preFrameTime = time;
      const input = this.$input.processInput();
      const env = { input, deltaTime };
      scene.callHook('onRenderFrameStart', { env });
      // eslint-disable-next-line
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.clearColor(0, 0, 0, 1.0);
      // shadow pass
      const shadowInfos = shadowShading.draw(proxy, { sendGpuDataVisitor });
      // light pass
      const colorTexture = defferShading.draw(proxy, { shadowInfos, sendGpuDataVisitor });
      /* Post-processing pass start */
      // Anti-aliasing
      const displayTexture = fxaaShader.draw(proxy, { texture: colorTexture });
      /* Post-processing pass end */
      // display texture pass
      displayShader.draw(proxy, displayTexture);
      scene.callHook('onRenderFrame', { env });
      scene.callHook('onRenderFrameEnd', { env });
      window.requestAnimationFrame(frame);
    };
    window.requestAnimationFrame(frame);
  }
}

Showcase.GLTFLoader = GLTFLoader;
