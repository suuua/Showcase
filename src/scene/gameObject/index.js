/**
 * material和shader是互相依赖的关系，shader决定material需要什么数据，可用什么选项。shader需要material的数据。
 */

import Light from '../../component/light';
import Camera from '../../component/camera';

const glMatrixS = require('gl-matrix');

const {
  mat4,
  vec3,
  quat,
} = glMatrixS;

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
    this.mesh = null;
    this.skin = skin;

    // Transformations
    this.setTransform(translation, rotation, scale, matrix);
  }

  get children() { return this.$children; }

  get matrix() { return this.$matrix; }

  get l2wTransMat4() { return this.$l2wTransMat4; }

  set l2wTransMat4(val) {
    this.$l2wTransMat4 = val;
    this.resetChildL2wTrans();
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
}
