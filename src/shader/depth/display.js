import Shader from '../index';
import fsSource from './display.frag.glsl';
import vsSource from './display.vert.glsl';

/**
 * https://www.khronos.org/opengl/wiki/Image_Format#Depth_formats
 * 关于阴影贴图的读取，需要使用专用Sampler格式
 */

export default class MergeMapShader extends Shader {
  constructor({ gl }) {
    super({ gl, vsSource, fsSource });
  }

  draw(depthMapInfo) {
    const gl = this.$gl;
    // set light pass data
    const plainVAO = this.createStandardPlainMesh();
    this.use();
    this.setInt('depthMap', 0);
    // eslint-disable-next-line
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clearColor(0, 0, 0, 1.0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, depthMapInfo.depthMap);
    gl.bindVertexArray(plainVAO);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
  }
}
