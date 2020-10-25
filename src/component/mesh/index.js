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
    this.$ShaderCache = new Map();
  }

  addPrimitive(infos) {
    this.primitives.push(infos);
  }

  // 深度仅需要知道顶点数据，可能也需要知道透明度
  onBeforeRenderDepth({ shader }) {
    const { matrix, l2wTransMat4 } = this.parent;
    const modelMartix = mat4.create();
    mat4.multiply(modelMartix, l2wTransMat4, matrix);
    const result = [];
    this.primitives.forEach((primitive) => {
      const { position, indices } = primitive;
      const atom = {};
      atom.VAO = shader.createBindVAO();
      shader.use();
      shader.createVBO(0, position);
      shader.createEBO(indices);
      result.push(atom);
    });
    this.$ShaderCache.set(shader, result);
  }

  onRenderDepth({ shader }) {
    const { gl } = shader;
    const renderInfos = this.$ShaderCache.get(shader);
    renderInfos.forEach((renderInfo) => {
      gl.bindVertexArray(renderInfo.VAO);
      shader.setMat4('model', renderInfo.modelMartix);
      gl.drawElements(gl.TRIANGLES, renderInfo.size, gl.UNSIGNED_SHORT, 0);
    });
  }

  /**
   * TODO: 这里应该依据shader提供的参数信息来适应不同shader的参数需要，目前只有一个shader说以不需要
   * @param {Shader} shader 着色器
   */
  onBeforeRender({ shader }) {
    const { matrix, l2wTransMat4 } = this.parent;
    const modelMartix = mat4.create();
    mat4.multiply(modelMartix, l2wTransMat4, matrix);
    const result = [];
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

        shader.setVec4('baseColorFactor', arr2vec(baseColorFactor || DEFAULT_BASE_COLOR_FACTOR, 4));
        const texture1 = shader.createBaseColorTexture(source);
        shader.setInt('texture1', 0);
        atom.texture1 = texture1;
        // TODO 金属性，法线贴图 emissive sampler
      }
      atom.size = indices.typeArray.length;
      atom.modelMartix = modelMartix;
      // TODO textcoord1 weight joint
      result.push(atom);
    });
    this.$ShaderCache.set(shader, result);
  }

  onRender({ shader }) {
    const { gl } = shader;
    const renderInfos = this.$ShaderCache.get(shader);
    renderInfos.forEach((renderInfo) => {
      if (renderInfo.texture1) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, renderInfo.texture1);
      }
      gl.bindVertexArray(renderInfo.VAO);
      shader.setMat4('model', renderInfo.modelMartix);
      /**
       * 这里文档中说使用gl.getExtension('OES_element_index_uint');时必须设置类型为gl.UNSIGNED_INT
       * 另外如果使用UNSIGNED_INT会导致报错“GL_INVALID_OPERATION: Insufficient buffer size.”
       */
      gl.drawElements(gl.TRIANGLES, renderInfo.size, gl.UNSIGNED_SHORT, 0);
    });
  }
}
