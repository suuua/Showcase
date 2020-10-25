/**
 * 物体材质包含对所用纹理的引用、平铺信息、颜色色调等来定义表面应使用的渲染方式
 * material的可用选项取决于材质使用的着色器
 */

const ALPHA_MODE_OPAQUE = 'OPAQUE';

function pbrMetallicRoughnessFactory({
  baseColorFactor = [1, 1, 1, 1],
  baseColorTexture,
  metallicFactor = 1,
  roughnessFactor = 1,
  metallicRoughnessTexture,
  // TODO:
  // extensions,
  // extras,
}) {
  return {
    baseColorFactor,
    baseColorTexture,
    metallicFactor,
    roughnessFactor,
    metallicRoughnessTexture,
  };
}

export default class Material {
  constructor({
    name,
    pbrMetallicRoughness,
    normalTexture,
    occlusionTexture,
    emissiveTexture,
    emissiveFactor = [0, 0, 0],
    alphaMode = ALPHA_MODE_OPAQUE,
    alphaCutoff = 0.5,
    doubleSided = false,
    // TODO: 这两个目前不知道有什么用，先保留
    // extras,
    // extensions,
  }) {
    this.name = name;
    this.pbrMetallicRoughness = pbrMetallicRoughnessFactory(pbrMetallicRoughness);
    this.normalTexture = normalTexture;
    this.occlusionTexture = occlusionTexture;
    this.emissiveTexture = emissiveTexture;
    this.emissiveFactor = emissiveFactor;
    this.alphaMode = alphaMode;
    this.alphaCutoff = alphaCutoff;
    this.doubleSided = doubleSided;
  }

  static get ALPHA_MODE_OPAQUE() { return ALPHA_MODE_OPAQUE; }
}
