/**
 * 物体材质包含对所用纹理的引用、平铺信息、颜色色调等来定义表面应使用的渲染方式
 * material的可用选项取决于材质使用的着色器
 */
export default class Material {
  /**
   * @param {Object} textures see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
   * @param {Shader} shader
   */
  constructor({ textures, shader }) {
    this.textures = textures;
    this.shader = shader;
  }
}
