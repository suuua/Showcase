import Shader from '../index';
import vsSource from './gbuffer.vert.glsl';
import fsSource from './gbuffer.frag.glsl';

export default class GBufferShader extends Shader {
  constructor({ gl }) {
    super({ gl, vsSource, fsSource });
  }

  // 关于此着色器参数描述包括变量名称，结构，内存布局，位置等属性
  // eslint-disable-next-line
  get description() {
    return {
      baseColor: 'texture_base',
      baseColorFactor: 'baseColorFactor',
    };
  }

  createFrameBuffer() {
    const gl = this.$gl;
    const SCR_WIDTH = gl.canvas.width;
    const SCR_HEIGHT = gl.canvas.height;
    const FBO = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, FBO);

    /**
     * 默认情况下color attachment 必须维rendable，默认下浮点不是rendable
     * 需要启用extendsion来允许部分浮点纹理的格式。详细见以下文档：
     * https://developer.mozilla.org/en-US/docs/Web/API/EXT_color_buffer_float
     * https://www.khronos.org/registry/OpenGL-Refpages/es3.0/
     */
    gl.getExtension('EXT_color_buffer_float');
    // - 位置颜色缓冲
    const positionTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, positionTexture);
    // OpenGl ES 文档中 RGB16F 和 RGB32F 不是 rendable 不能用作颜色附着的纹理文件格式？
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA16F,
      SCR_WIDTH,
      SCR_HEIGHT,
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
      positionTexture,
      0,
    );
    gl.bindTexture(gl.TEXTURE_2D, null);

    // - 法线颜色缓冲
    const normalTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, normalTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA16F,
      SCR_WIDTH,
      SCR_HEIGHT,
      0,
      gl.RGBA,
      gl.FLOAT,
      null,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, normalTexture, 0);
    gl.bindTexture(gl.TEXTURE_2D, null);

    // - 颜色 + 镜面颜色缓冲
    const albedoOcclusionTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, albedoOcclusionTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      SCR_WIDTH,
      SCR_HEIGHT,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT2,
      gl.TEXTURE_2D,
      albedoOcclusionTexture,
      0,
    );
    gl.bindTexture(gl.TEXTURE_2D, null);

    // - 深度缓冲
    const depthMetallicRoughnessTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, depthMetallicRoughnessTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA16F,
      SCR_WIDTH,
      SCR_HEIGHT,
      0,
      gl.RGBA,
      gl.FLOAT,
      null,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT3,
      gl.TEXTURE_2D,
      depthMetallicRoughnessTexture,
      0,
    );
    gl.bindTexture(gl.TEXTURE_2D, null);

    gl.drawBuffers([
      gl.COLOR_ATTACHMENT0,
      gl.COLOR_ATTACHMENT1,
      gl.COLOR_ATTACHMENT2,
      gl.COLOR_ATTACHMENT3,
    ]);

    // - 深度信息
    const depthRBO = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthRBO);
    // 为了能复制缓冲，源和目标缓冲格式必须相同，因此这里最好和默认缓冲的深度缓冲格式一致
    // 这里各种格式都试过，都无法复制到默认深度缓冲，为什么？
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, SCR_WIDTH, SCR_HEIGHT);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRBO);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return {
      FBO,
      positionTexture,
      normalTexture,
      albedoOcclusionTexture,
      depthMetallicRoughnessTexture,
      depthRBO,
    };
  }
}
