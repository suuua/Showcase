import { commonShaderData } from '../../helper';
import Shader from '../index';
import vsSource from './ambient.vert.glsl';
import fsSource from './ambient.frag.glsl';

export default class LightShader extends Shader {
  constructor({ gl }) {
    super({
      gl,
      vsSource,
      fsSource,
    });

    this.$FBO = null;

    this.use();
    this.setInt('gAlbedoOcclusion', 0);
    this.setInt('loTexture', 1);
  }

  $createFrameBuffer(info) {
    const gl = this.$gl;
    const FBO = gl.createFramebuffer();
    const colorTexture = gl.createTexture();
    const { width, height } = info;
    gl.bindFramebuffer(gl.FRAMEBUFFER, FBO);
    gl.bindTexture(gl.TEXTURE_2D, colorTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      width,
      height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      colorTexture,
      0,
    );
    gl.drawBuffers([gl.COLOR_ATTACHMENT0]);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);

    return [FBO, colorTexture];
  }

  draw(scene, {
    albedoOcclusionTexture,
    loTexture,
  }) {
    const gl = this.$gl;

    if (!this.$FBO) {
      this.$FBO = this.$createFrameBuffer({
        width: gl.drawingBufferWidth,
        height: gl.drawingBufferHeight,
      });
    }
    const [FBO, colorTexture] = this.$FBO;

    this.use();
    gl.bindFramebuffer(gl.FRAMEBUFFER, FBO);
    // eslint-disable-next-line
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clearColor(0, 0, 0, 1.0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, albedoOcclusionTexture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, loTexture);

    gl.bindVertexArray(commonShaderData.getPlain(gl));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // unbind texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return colorTexture;
  }
}
