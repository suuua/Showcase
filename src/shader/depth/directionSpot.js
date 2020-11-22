import Shader from '../index';
import vsSource from './directionSpot.vert.glsl';
import fsSource from './directionSpot.frag.glsl';

export default class DirectionShader extends Shader {
  constructor({ gl }) {
    super({ gl, vsSource, fsSource });
  }

  $createDepthMap(width, height) {
    const gl = this.$gl;
    const FBO = gl.createFramebuffer();
    // 包含所有光源的阴影
    const depthMap = this.createEmptyDepthTexture2D({ width, height });
    gl.bindFramebuffer(gl.FRAMEBUFFER, FBO);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.DEPTH_ATTACHMENT,
      gl.TEXTURE_2D,
      depthMap,
      0,
    );
    gl.drawBuffers([gl.NONE]);
    // gl.readBuffer(gl.NONE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { FBO, depthMap };
  }

  /**
   * 绘制每光源的阴影贴图
   */
  draw(scene) {
    const gl = this.$gl;
    this.use();
    let renderObjects = [];
    scene.eachMeshComponents((component) => {
      renderObjects = renderObjects.concat(
        component.setMeshRenderData({ shader: this }),
      );
    });
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.depthFunc(gl.LESS);
    gl.cullFace(gl.FRONT);
    gl.colorMask(false, false, false, false);
    const direction = scene.filterLightDirectionComponents();
    const spot = scene.filterLightSpotComponents();
    const viewPortWidth = scene.diagonalPixel;
    const result = direction.concat(spot).map((component) => {
      const { FBO, depthMap } = this.$createDepthMap(viewPortWidth, viewPortWidth);
      // bindFramebuffer 必须在clear之上，不然无法绑定成功
      gl.bindFramebuffer(gl.FRAMEBUFFER, FBO);
      // gl.clearColor(0, 0, 0, 1.0);
      // eslint-disable-next-line
      // gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      const position = scene.axiasArea[0].map((i) => i + 1);
      const lightSpaceMatrix = component.getSpaceMat4({
        position,
        width: scene.diagonal,
      });
      this.setMat4('lightSpaceMatrix', lightSpaceMatrix);
      // render Mesh
      renderObjects.forEach(({
        VAO,
        modelMartix,
        size,
      }) => {
        gl.bindVertexArray(VAO);
        this.setMat4('model', modelMartix);
        gl.drawElements(gl.TRIANGLES, size, gl.UNSIGNED_SHORT, 0);
      });
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return {
        depthMap,
        lightSpaceMatrix,
        light: component,
      };
    });
    gl.cullFace(gl.BACK);
    gl.disable(gl.CULL_FACE);
    gl.colorMask(true, true, true, true);
    return result;
  }
}
