/**
 * 使用Visitor去访问Scene实现更细粒度的控制和GPU内存管理。
 * ---------------------------------------------------------------
 * 向GPU内存发送数据，这里数据布局，和索引点是由shader中的代码决定的，
 * 这里使用了约定，来决定数据的顺序和绑定点。后续应该使用一个更灵活的方式，
 * 来适应不同shader的不同顶点布局，统一变量顺序
 */

import { arr2vec } from '../helper';

export default class SendGpuDataVisitor {
  constructor({ scene, gl }) {
    // 用于标识是哪个场景
    this.scene = scene;
    // 用于标识此Visitor用于哪个gl上下文
    this.gl = gl;
    // 共享材质，贴图的GPU数据缓存的索引。
    this.$GPUMemory = new Map();
  }

  /**
   * @param {Shader} generator 创建工具，可以是同一gl下的任何一个shader
   */
  mesh(mesh, generator) {
    const { primitives } = mesh;
    const priGpuDataArr = primitives.map((primitive) => this.primitive(primitive, generator));
    return {
      primitives: priGpuDataArr,
    };
  }

  primitive(primitive, generator) {
    const primitiveGpuDataCache = this.$GPUMemory.get(primitive);
    if (primitiveGpuDataCache) { return primitiveGpuDataCache; }
    const primitiveGpuData = {};
    const {
      position,
      indices,
      normal,
      material,
    } = primitive;
    primitiveGpuData.VAO = generator.createBindVAO();
    generator.use();
    // vertex attr
    generator.createVBO(0, position);
    generator.createEBO(indices);
    if (normal) { generator.createVBO(1, normal); }
    // texCoord
    let i = 0;
    const preName = 'texcoord_';
    while (primitive[preName + i]) {
      primitiveGpuData[preName + i] = generator.createVBO(2 + i, primitive[preName + i]);
      i += 1;
    }
    if (material) {
      primitiveGpuData.material = this.material(material, primitiveGpuData, generator);
    }
    primitiveGpuData.size = indices.typeArray.length;
    this.$GPUMemory.set(primitive, primitiveGpuData);
    return primitiveGpuData;
  }

  material(material, primitiveGpuData, generator) {
    const materialCache = this.$GPUMemory.get(material);
    if (materialCache) { return materialCache; }
    const materialGpuData = {};
    const {
      pbrMetallicRoughness,
      normalTexture,
      emissiveFactor,
      alphaCutoff,
    } = material;
    const {
      baseColorTexture,
      baseColorFactor,
      metallicRoughnessTexture,
      metallicFactor,
      roughnessFactor,
      occlusionTexture,
    } = pbrMetallicRoughness;
    materialGpuData.baseColorFactor = arr2vec(baseColorFactor, 4);
    if (baseColorTexture) {
      materialGpuData.baseColorTexture = this.texture(
        baseColorTexture,
        primitiveGpuData,
        generator,
      );
    }

    materialGpuData.metallicFactor = metallicFactor;
    materialGpuData.roughnessFactor = roughnessFactor;
    if (metallicRoughnessTexture) {
      materialGpuData.metallicRoughnessTexture = this.texture(
        metallicRoughnessTexture,
        primitiveGpuData,
        generator,
      );
    }

    if (normalTexture) {
      materialGpuData.normalTexture = this.texture(
        normalTexture,
        primitiveGpuData,
        generator,
      );
    }

    if (occlusionTexture) {
      materialGpuData.occlusionTexture = this.texture(
        occlusionTexture,
        primitiveGpuData,
        generator,
      );
    }

    materialGpuData.emissiveFactor = arr2vec(emissiveFactor, 3);
    materialGpuData.alphaCutoff = alphaCutoff;
    this.$GPUMemory.set(material, materialGpuData);
    return materialGpuData;
  }

  texture(texture, primitiveGpuData, generator) {
    const result = {};
    const { texCoord, source, scale } = texture;
    const gpuTextureCache = this.$GPUMemory.get(source);
    if (gpuTextureCache) {
      result.texture = gpuTextureCache;
    } else {
      const gpuTexture = generator.createBaseColorTexture(source);
      this.$GPUMemory.set(source, gpuTexture);
      result.texture = gpuTexture;
    }
    if (scale) { result.scale = scale; }
    result.texCoord = primitiveGpuData[`texcoord_${texCoord}`];
    return result;
  }
}
