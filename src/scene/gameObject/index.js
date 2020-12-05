/**
 * material和shader是互相依赖的关系，shader决定material需要什么数据，可用什么选项。shader需要material的数据。
 */

import Light from '../component/light';
import Camera from '../component/camera';
import Mesh from '../component/mesh';

const {
  mat4,
  vec3,
  quat,
  vec4,
} = require('gl-matrix');

const wordTransMat4 = mat4.create();
mat4.fromRotationTranslationScale(
  wordTransMat4,
  quat.fromValues(0, 0, 0, 1),
  vec3.fromValues(0, 0, 0),
  vec3.fromValues(1, 1, 1),
);

export default class GameObject {
  constructor({
    name = 'GameObject',
    rotation = [0, 0, 0, 1],
    scale = [1, 1, 1],
    translation = [0, 0, 0],
    matrix,
    weights = null,
    skin,
  } = {}) {
    // 必须在开头
    // 一个将自己的local坐标变换为word坐标的坐标变换矩阵
    this.$l2wTransMat4 = wordTransMat4;
    this.components = [];
    this.$children = [];
    this.name = name;
    this.weights = weights;
    this.skin = skin;

    this.$modelMartix = null;
    this.$dirtyModel = true;
    // Transformations
    this.setTransform(translation, rotation, scale, matrix);
  }

  get children() { return this.$children; }

  get matrix() { return this.$matrix; }

  get l2wTransMat4() { return this.$l2wTransMat4; }

  set l2wTransMat4(val) {
    this.$l2wTransMat4 = val;
    this.$dirtyModel = true;
    this.resetChildL2wTrans();
  }

  get modelMartix() {
    if (!this.$dirtyModel) { return this.$modelMartix; }
    this.$dirtyModel = false;
    const { matrix, l2wTransMat4 } = this;
    this.$modelMartix = mat4.create();
    mat4.multiply(this.$modelMartix, l2wTransMat4, matrix);
    return this.$modelMartix;
  }

  get translation() { return [...this.$translation]; }

  get rotation() { return [...this.$rotation]; }

  get scale() { return [...this.$scale]; }

  get isCamera() {
    return this.components.findIndex((c) => c instanceof Camera) > -1;
  }

  get cameraComponent() {
    return this.components.find((c) => c instanceof Camera);
  }

  get meshComponent() {
    return this.components.find((c) => c instanceof Mesh);
  }

  get isLight() {
    return this.components.findIndex((c) => c instanceof Light) > -1;
  }

  get lightComponent() {
    return this.components.find((c) => c instanceof Light);
  }

  resetChildL2wTrans() {
    const newL2wTrans = mat4.create();
    mat4.multiply(newL2wTrans, this.l2wTransMat4, this.matrix);
    this.children.forEach((child) => {
      // eslint-disable-next-line
      child.l2wTransMat4 = newL2wTrans;
    });
  }

  setTransform(t, r, s, m) {
    if (t) { this.$translation = [...t]; }
    if (r) { this.$rotation = [...r]; }
    if (s) { this.$scale = [...s]; }
    if (m) {
      this.$matrix = m;
    } else {
      this.$matrix = mat4.create();
      // vec3.fromValues(x, y, z);
      mat4.fromRotationTranslationScale(
        this.$matrix,
        quat.fromValues(...this.$rotation),
        vec3.fromValues(...this.$translation),
        vec3.fromValues(...this.$scale),
      );
    }
    this.$dirtyModel = true;
    this.resetChildL2wTrans();
  }

  addComponent(component) {
    // eslint-disable-next-line
    component.parent = this;
    this.components.push(component);
  }

  getComponent(component) {
    if (typeof component === 'string') {
      return this.components.find((c) => c.tag === component);
    }
    return this.components.find((c) => c === component);
  }

  deleteComponent(component) {
    return this.components.splice(this.components.findIndex((c) => c === component), 1);
  }

  addChild(child) {
    // eslint-disable-next-line
    child.l2wTransMat4 = mat4.create();
    mat4.multiply(child.l2wTransMat4, this.l2wTransMat4, this.matrix);
    this.$children.push(child);
  }

  // TODO: 这里计算量可能会很大，需要缓存优化
  getWorldAxiasArea() {
    const { meshComponent } = this;
    if (!meshComponent) { return null; }
    const meshAxiasArea = meshComponent.getAxiasArea();
    const wordMax = vec4.create();
    const wordMin = vec4.create();
    const modelMartix = mat4.create();
    mat4.multiply(modelMartix, this.l2wTransMat4, this.matrix);
    vec4.transformMat4(wordMax, vec4.fromValues(...meshAxiasArea[0], 1), modelMartix);
    vec4.transformMat4(wordMin, vec4.fromValues(...meshAxiasArea[1], 1), modelMartix);
    return [
      [wordMax[0], wordMax[1], wordMax[2]],
      [wordMin[0], wordMin[1], wordMin[2]],
    ];
  }
}
