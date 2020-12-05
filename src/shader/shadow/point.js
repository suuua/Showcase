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

  draw(scene, { sendGpuDataVisitor }) {
    const gl = this.$gl;
    const width = scene.diagonalPixel;
    const pointLights = scene.filterLightPointComponents();
    const result = [];
    this.use();
    pointLights.forEach((light) => {
      const cubeLightSpaceMat4 = light.cubeSpaceMat4({ width });
      for (let i = 0; i < 6; i += 1) {
        const { FBO, depthMap } = this.$createFrameBuffer({ width, height: width });
        gl.bindFramebuffer(gl.FRAMEBUFFER, FBO);
        gl.clear(gl.DEPTH_BUFFER_BIT);
        const lightSpaceMatrix = cubeLightSpaceMat4[i];
        this.setMat4('lightSpaceMatrix', lightSpaceMatrix);
        // render mesh
        scene.eachMeshComponents((mesh) => {
          const { modelMartix } = mesh.parent;
          const { primitives } = sendGpuDataVisitor.mesh(mesh, this);
          this.setMat4('model', modelMartix);
          primitives.forEach(({ VAO, size }) => {
            gl.bindVertexArray(VAO);
            gl.drawElements(gl.TRIANGLES, size, gl.UNSIGNED_SHORT, 0);
          });
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
