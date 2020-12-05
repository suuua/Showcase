import Shader from '../index';
import fsSource from './toCameraSpace.frag.glsl';
import vsSource from './toCameraSpace.vert.glsl';

/**
 * 将阴影深度贴图转换到摄像机空间下的阴影
 */
export default class ToCameraSpaceShader extends Shader {
  constructor({ gl }) {
    super({ gl, fsSource, vsSource });
    this.$FBOS = [];
  }

  $createFrameBuffer(info) {
    const gl = this.$gl;
    gl.getExtension('EXT_color_buffer_float');
    const FBO = gl.createFramebuffer();
    const shadowTexture = gl.createTexture();
    const { width, height } = info;
    gl.bindFramebuffer(gl.FRAMEBUFFER, FBO);
    gl.bindTexture(gl.TEXTURE_2D, shadowTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.R16F,
      width,
      height,
      0,
      gl.RED,
      gl.FLOAT,
      null,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      shadowTexture,
      0,
    );
    gl.drawBuffers([gl.COLOR_ATTACHMENT0]);

    // - 深度信息，这里需要深度附着，如果没有深度附着会导致无法进行深度测试
    const RBODepth = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, RBODepth);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, RBODepth);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);

    return [FBO, shadowTexture, RBODepth];
  }

  draw(scene, { depthMapInfos, sendGpuDataVisitor }) {
    const gl = this.$gl;
    const width = scene.diagonalPixel;
    const { camera } = scene;

    // 为每个深度贴图创建一个对应的 FBO 这个FBO可以重复使用
    if (this.$FBOS.length !== depthMapInfos.length) {
      this.$FBOS.length = 0;
      for (let i = 0; i < depthMapInfos.length; i += 1) {
        this.$FBOS[i] = this.$createFrameBuffer({ width, height: width });
      }
    }

    this.use();
    this.setMat4('cameraSpaceMatrix', camera.spaceMat4);
    this.setInt('depthMap', 0);
    const result = depthMapInfos.map(({ depthMap, lightSpaceMatrix, light }, index) => {
      const [FBO, shadowTexture] = this.$FBOS[index];
      this.setMat4('lightSpaceMatrix', lightSpaceMatrix);
      this.setUInt('light.type', light.type);
      if (light.tag === 'LightDirection') {
        this.setVec3('light.direction', light.direction);
      } else if (light.tag === 'LightSpot') {
        this.setVec3('light.direction', light.direction);
        this.setVec3('light.position', light.position);
      } else {
        this.setVec3('light.position', light.position);
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, FBO);
      // eslint-disable-next-line
      gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
      gl.clearColor(0, 0, 0, 1);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, depthMap);
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

      return {
        shadowTexture,
        light,
      };
    });

    return result;
  }
}
