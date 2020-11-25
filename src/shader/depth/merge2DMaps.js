import Shader from '../index';
import fsSource from './merge2DMaps.frag.glsl';
import vsSource from './merge2DMaps.vert.glsl';

/**
 * 这里使用模板还是贴图
 */
export default class Merge2DMapsShader extends Shader {
  constructor({ gl }) {
    super({ gl, fsSource, vsSource });
    this.FBOS = [];
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
    // 为了能复制缓冲，源和目标缓冲格式必须相同，因此这里最好和默认缓冲的深度缓冲格式一致
    // 这里各种格式都试过，都无法复制到默认深度缓冲，为什么？
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, RBODepth);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);

    return [FBO, shadowTexture, RBODepth];
  }

  $clearFBOS() {
    const gl = this.$gl;
    const [[FBO1], [FBO2]] = this.FBOS;
    gl.bindFramebuffer(gl.FRAMEBUFFER, FBO1);
    // eslint-disable-next-line
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
    gl.clearColor(0, 0, 0, 1);

    gl.bindFramebuffer(gl.FRAMEBUFFER, FBO2);
    // eslint-disable-next-line
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
    gl.clearColor(0, 0, 0, 1);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  draw(scene, depthMapinfos) {
    const gl = this.$gl;
    const camera = scene.getCameraComponent();
    this.use();
    let renderObjects = [];
    scene.eachMeshComponents((component) => {
      renderObjects = renderObjects.concat(
        component.setMeshRenderData({ shader: this }),
      );
    });
    if (this.FBOS.length === 0) {
      const bufferInfo = { width: scene.diagonalPixel, height: scene.diagonalPixel };
      this.FBOS = [
        this.$createFrameBuffer(bufferInfo),
        this.$createFrameBuffer(bufferInfo),
      ];
    }
    this.$clearFBOS();

    this.setMat4('cameraSpaceMatrix', camera.spaceMat4);
    this.setInt('preShadowDepthMap', 0);
    this.setInt('depthMap', 1);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);

    let result;
    depthMapinfos.forEach((info, index) => {
      const { depthMap, light, lightSpaceMatrix } = info;
      const source = this.FBOS[index % 2];
      const target = this.FBOS[1 - (index % 2)];
      const [FBO, depthTexture] = target;

      gl.bindFramebuffer(gl.FRAMEBUFFER, FBO);
      // eslint-disable-next-line
      gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
      gl.clearColor(0, 0, 0, 1);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, source[1]);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, depthMap);
      this.setFloat('light.intensity', light.intensity);
      this.setMat4('lightSpaceMatrix', lightSpaceMatrix);
      if (light.tag === 'LightDirection') {
        this.setVec3('light.direction', light.direction);
        this.setUInt('lightType', 1);
      } else if (light.tag === 'LightSpot') {
        this.setVec3('light.direction', light.direction);
        this.setVec3('light.position', light.position);
        this.setUInt('lightType', 2);
      } else {
        this.setVec3('light.position', light.position);
        this.setUInt('lightType', 3);
      }

      // render GameObject
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
      result = depthTexture;
    });
    return result;
  }
}
