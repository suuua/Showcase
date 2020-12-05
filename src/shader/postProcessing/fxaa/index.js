import { commonShaderData } from '../../../helper';
import Shader from '../../index';
import fsSource from './fxaa.frag.glsl';
import vsSource from './fxaa.vert.glsl';

/**
 * https://www.khronos.org/opengl/wiki/Image_Format#Depth_formats
 * 关于阴影贴图的读取，需要使用专用Sampler格式
 */

export default class FXAAShader extends Shader {
  constructor({ gl }) {
    super({ gl, vsSource, fsSource });
    this.use();
    this.setInt('playTexture', 0);
    this.$FBO = this.$createFrameBuffer({
      width: gl.drawingBufferWidth,
      height: gl.drawingBufferHeight,
    });
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

  draw(scene, { texture }) {
    const gl = this.$gl;
    const SCR_WIDTH = gl.drawingBufferWidth;
    const SCR_HEIGHT = gl.drawingBufferHeight;
    const [FBO, colorTexture] = this.$FBO;
    this.use();
    gl.bindFramebuffer(gl.FRAMEBUFFER, FBO);
    // eslint-disable-next-line
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clearColor(0, 0, 0, 1.0);
    this.setVec2('resolution', [SCR_WIDTH, SCR_HEIGHT]);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.bindVertexArray(commonShaderData.getPlain(gl));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return colorTexture;
  }
}
