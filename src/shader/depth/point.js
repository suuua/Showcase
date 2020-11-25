import Shader from '../index';
import vsSource from './point.vert.glsl';
import fsSource from './point.frag.glsl';

/**
 * OpenGl ES 不支持几何着色器，因此把点光源拆分为立放体的六个面，每个面单独渲染
 */
export default class PointShader extends Shader {
  constructor({ gl }) {
    super({ gl, vsSource, fsSource });
  }

  $createFrameBuffer({ width, height }) {
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
    gl.readBuffer(gl.NONE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { FBO, depthMap };
  }

  draw(scene) {
    const gl = this.$gl;
    const width = scene.diagonalPixel;
    const pointLights = scene.filterLightPointComponents();
    let renderObjects = [];
    scene.eachMeshComponents((component) => {
      renderObjects = renderObjects.concat(
        component.setMeshRenderData({ shader: this }),
      );
    });

    const result = [];
    this.use();
    gl.viewport(0, 0, width, width);
    pointLights.forEach((light) => {
      const cubeLightSpaceMat4 = light.cubeSpaceMat4({ width });
      for (let i = 0; i < 6; i += 1) {
        const { FBO, depthMap } = this.$createFrameBuffer({ width, height: width });
        const lightSpaceMatrix = cubeLightSpaceMat4[i];
        gl.bindFramebuffer(gl.FRAMEBUFFER, FBO);
        gl.clear(gl.DEPTH_BUFFER_BIT);
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

        result.push({
          depthMap,
          lightSpaceMatrix,
          light,
        });
      }
    });

    return result;
  }
}
