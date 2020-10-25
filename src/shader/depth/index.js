import Shader from '../index';
import vsSource from './vertex.glsl';
import fsSource from './fragment.glsl';

export default class DepthShader extends Shader {
  constructor({ gl }) {
    super({ gl, vsSource, fsSource });
    const { width, height } = gl.canvas;
    // TODO: 关于深度贴图的分辨率，以512的整数倍最好?
    this.texWidth = Math.max(width, 1024);
    this.texHeight = Math.max(height, 1024);
  }

  /**
   * 由于除了具有动画的物体外，所有的物体都是静止不动的，因此，渲染阴影可以使用
   * 静态烘焙（static backing）一次性将全部阴影烘焙到阴影贴图中去。对动态
   * 物体使用实时烘焙
   */
  $createDepthMap() {
    const gl = this.$gl;

    const FBO = gl.createFramebuffer();

    // Depth
    const depthMap = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, depthMap);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.DEPTH_COMPONENT,
      this.texWidth,
      this.texHeight,
      0,
      gl.DEPTH_COMPONENT,
      gl.FLOAT,
      null,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

    // Stencil
    const stencilMap = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, stencilMap);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.DEPTH_COMPONENT,
      this.texWidth,
      this.texHeight,
      0,
      gl.DEPTH_COMPONENT,
      gl.FLOAT,
      null,
    );

    gl.bindFramebuffer(gl.FRAMEBUFFER, FBO);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthMap, 0);
    gl.drawBuffers(gl.NONE);
    gl.readBuffer(gl.NONE);
    // gl.bindFramebuffer(gl.FRAMEBUFFER, 0);
    return { FBO, depthMap };
  }

  /**
   * 绘制阴影贴图，这里每光源只用绘制一帧就够
   * 这里有个问题时如何知道当前场景是否渲染完成
   */
  draw(scene) {
    const gl = this.$gl;
    gl.viewport(0, 0, this.texWidth, this.texHeight);
    const { FBO, depthMap } = this.$createDepthMap;
    this.use();
    scene.visitor.callHook('onBeforeRenderDepth');
    gl.bindFramebuffer(gl.FRAMEBUFFER, FBO);
    gl.enable(gl.DEPTH_TEST);
    scene.interator.eachLights((light) => {
      if (!light.viewMat4 || !this.perspectiveMat4) { return; }
      // TODO: 这里应该用 hook 还是直接调用?
      this.setMat4('view', light.viewMat4);
      this.setMat4('perspective', this.perspectiveMat4);
      gl.clearColor(0, 0, 0, 1.0);
      // eslint-disable-next-line
      gl.clear(gl.DEPTH_BUFFER_BIT);
      scene.visitor.callHook('onRenderDepth');
      light.depthMap.set('static', depthMap);
    });
    return depthMap;
  }
}
