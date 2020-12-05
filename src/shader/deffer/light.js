import { commonShaderData } from '../../helper';
import Shader from '../index';
import vsSource from './light.vert.glsl';
import fsSource from './light.frag.glsl';

export default class LightShader extends Shader {
  constructor({ gl }) {
    super({
      gl,
      vsSource,
      fsSource,
    });

    this.$FBOS = null;

    this.use();
    this.setInt('gPosition', 0);
    this.setInt('gNormal', 1);
    this.setInt('gAlbedoOcclusion', 2);
    this.setInt('gDepthMetallicRoughness', 3);
    this.setInt('shadowMap', 4);
    this.setInt('preLoTexture', 5);
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
      gl.RGBA16F,
      width,
      height,
      0,
      gl.RGBA,
      gl.FLOAT,
      null,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
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

    return [FBO, shadowTexture];
  }

  $clearFBOS() {
    const gl = this.$gl;
    const [[FBO1], [FBO2]] = this.$FBOS;
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

  draw(
    scene,
    {
      positionTexture,
      normalTexture,
      albedoOcclusionTexture,
      depthMetallicRoughnessTexture,
      shadowInfos,
    },
  ) {
    const gl = this.$gl;
    this.use();

    if (!this.$FBOS) {
      const bufferInfo = { width: gl.drawingBufferWidth, height: gl.drawingBufferHeight };
      this.$FBOS = [
        this.$createFrameBuffer(bufferInfo),
        this.$createFrameBuffer(bufferInfo),
      ];
    }

    this.$clearFBOS();

    // set camera data
    this.setVec3('viewPos', scene.camera.position);
    let result;
    shadowInfos.forEach(({ shadowTexture, light }, index) => {
      const source = this.$FBOS[index % 2];
      const target = this.$FBOS[1 - (index % 2)];
      const [FBO, depthTexture] = target;

      this.setUInt('light.type', light.type);
      this.setFloat('light.intensity', light.intensity);
      this.setVec3('light.color', light.color);
      if (light.position) { this.setVec3('light.position', light.position); }
      if (light.direction) { this.setVec3('light.direction', light.direction); }
      if (light.range) { this.setFloat('light.range', light.range); }
      if (light.innerConeAngle) { this.setFloat('light.innerConeAngle', Math.cos(light.innerConeAngle)); }
      if (light.outerConeAngle) { this.setFloat('light.outerConeAngle', Math.cos(light.outerConeAngle)); }

      gl.bindFramebuffer(gl.FRAMEBUFFER, FBO);
      // eslint-disable-next-line
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.clearColor(0, 0, 0, 1);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, positionTexture);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, normalTexture);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, albedoOcclusionTexture);
      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_2D, depthMetallicRoughnessTexture);
      gl.activeTexture(gl.TEXTURE4);
      gl.bindTexture(gl.TEXTURE_2D, shadowTexture);
      gl.activeTexture(gl.TEXTURE5);
      gl.bindTexture(gl.TEXTURE_2D, source[1]);

      gl.bindVertexArray(commonShaderData.getPlain(gl));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.bindVertexArray(null);

      // unbind texture
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.activeTexture(gl.TEXTURE4);
      gl.bindTexture(gl.TEXTURE_2D, null);

      result = depthTexture;
    });
    return result;
  }
}
