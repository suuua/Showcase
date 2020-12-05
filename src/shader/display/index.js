import { commonShaderData } from '../../helper';
import Shader from '../index';
import fsSource from './display.frag.glsl';
import vsSource from './display.vert.glsl';

export default class DisplayShader extends Shader {
  constructor({ gl }) {
    super({ gl, vsSource, fsSource });
    this.use();
    this.setInt('depthMap', 0);
  }

  draw(scene, texture) {
    const gl = this.$gl;
    this.use();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    // eslint-disable-next-line
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clearColor(0, 0, 0, 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.bindVertexArray(commonShaderData.getPlain(gl));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
  }
}
