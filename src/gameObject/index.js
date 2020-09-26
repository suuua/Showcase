/**
 * 游戏对象的结构待定。需要依据模型文件来设计
 * material和shader是互相依赖的关系，shader决定GameObject需要什么数据，可用什么选项。shader需要GameObject的数据。
 */
const glMatrixS = require('gl-matrix');

const {
  mat4,
  vec3,
  glMatrix,
  quat,
} = glMatrixS;

export default class GameObject {
  constructor({
    name = 'GameObject',
    rotation = [0, 0, 0, 0],
    scale = [1, 1, 1],
    translation = [0, 0, 0],
    matrix,
    weights = null,
    skin,
  }) {
    this.name = name;
    // Transformations
    this.setTransform(translation, rotation, scale, matrix);
    this.weights = weights;
    this.mesh = null;
    this.skin = skin;

    this.isCamera = false;
    this.components = [];
    this.children = [];
  }

  get matrix() { return this.$matrix; }

  setTransform(t, r, s, m) {
    if (t) { this.$translation = t; }
    if (r) { this.$rotation = r; }
    if (s) { this.$scale = s; }
    // TODO: how to add rotation
    if (m) {
      this.$matrix = m;
    } else {
      glMatrix.setMatrixArrayType(Array);
      this.$matrix = mat4.create();
      // vec3.fromValues(x, y, z);
      mat4.fromRotationTranslationScale(
        this.$matrix,
        quat.fromValues(...r),
        vec3.fromValues(...t),
        vec3.fromValues(...s),
      );
    }
  }

  addComponent(component) {
    this.components.push(component);
  }

  getComponent(component) {
    return this.components.find(component);
  }

  deleteComponent(component) {
    return this.components.splice(this.components.findIndex(component), 1);
  }

  addChild(child) {
    this.children.push(child);
  }
}
