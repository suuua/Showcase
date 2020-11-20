/**
 * 基于GLTF文件结构设计
 */
import Component from '../index';
import { arr2vec } from '../../helper';

const { mat4 } = require('gl-matrix');

const DEFAULT_BASE_COLOR_FACTOR = [1.0, 1.0, 1.0, 1.0];

export default class Mesh extends Component {
  constructor(...args) {
    super(...args);
    // TODO: material
    // 网格可能会被分割，所以实际网格是一个数组
    this.primitives = [];
    this.$memCache = [];
    this.tag = 'Mesh';
  }

  addPrimitive(infos) {
    this.primitives.push(infos);
  }

  // setMeshVertData({ shader }) {
  //   const { matrix, l2wTransMat4 } = this.parent;
  //   const modelMartix = mat4.create();
  //   mat4.multiply(modelMartix, l2wTransMat4, matrix);
  //   const result = [];
  //   shader.use();
  //   this.primitives.forEach((primitive) => {
  //     const {
  //       position,
  //       indices,
  //     } = primitive;
  //     const atom = {};
  //     atom.VAO = shader.createBindVAO();

  //     shader.createVBO(0, position);
  //     shader.createEBO(indices);

  //     atom.size = indices.typeArray.length;
  //     atom.modelMartix = modelMartix;
  //     // TODO textcoord1 weight joint
  //     result.push(atom);
  //   });
  //   return result;
  // }

  setMeshRenderData({ shader }) {
    const { matrix, l2wTransMat4 } = this.parent;
    const modelMartix = mat4.create();
    // const { description } = shader;
    mat4.multiply(modelMartix, l2wTransMat4, matrix);
    if (this.$memCache.length === this.primitives.length) {
      return this.$memCache;
    }
    this.$memCache = [];
    this.primitives.forEach((primitive) => {
      const {
        position,
        indices,
        normal,
        material,
      } = primitive;
      const atom = {};
      atom.VAO = shader.createBindVAO();

      shader.use();
      shader.createVBO(0, position);
      shader.createEBO(indices);

      if (normal) { shader.createVBO(1, normal); }

      if (material) {
        const { baseColorTexture, baseColorFactor } = material.pbrMetallicRoughness;
        const { texCoord, source } = baseColorTexture;
        shader.createVBO(2, primitive[`texcoord_${texCoord}`]);

        const texture1 = shader.createBaseColorTexture(source);
        // shader.setInt(description.baseColor, 0);
        atom.baseColorTexture = texture1;
        atom.baseColorFactor = arr2vec(baseColorFactor || DEFAULT_BASE_COLOR_FACTOR, 4);
        // TODO 金属性，法线贴图 emissive sampler
      }
      atom.size = indices.typeArray.length;
      atom.modelMartix = modelMartix;
      // TODO textcoord1 weight joint
      this.$memCache.push(atom);
    });
    return this.$memCache;
  }
}
