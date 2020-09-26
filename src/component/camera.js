/**
 * 用于创建摄像机
 */

import Component from './index';

const { mat4, vec3 } = require('gl-matrix');

function isEqualArray(arr1, arr2) {
  if (!arr1 || !arr2 || arr1.length !== arr2.length) { return false; }
  for (let i = 0; i < arr1.length; i += 1) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }
  return true;
}

export default class Camera extends Component {
  constructor({
    // view 变换需要参数
    position = [0, 0, 3],
    front = [0, 0, 0],
    up = [0, 1, 0],
    // perspective 变换需要参数
    fov = 45,
    aspect = 1,
    near = 0.1,
    far = 100,
    parent,
  }) {
    super({});
    this.$dirtyView = true;
    // TODO: 这些属性应当来自于父GameObject, 这里先简化
    this.$position = position;
    this.$front = front;
    this.$up = up;
    this.$viewMat4 = mat4.create();

    this.$dirtyPers = true;
    this.$fov = fov;
    this.$aspect = aspect;
    this.$near = near;
    this.$far = far;
    this.$persMat4 = mat4.create();
    // 所属GameObject
    this.parent = parent;
    this.tag = 'camera';
  }

  set position(newVal) {
    if (!isEqualArray(newVal, this.$position)) {
      this.$position = newVal;
      this.$dirtyView = true;
    }
  }

  get position() { return this.$position; }

  set front(newVal) {
    if (!isEqualArray(newVal, this.$front)) {
      this.$front = newVal;
      this.$dirtyView = true;
    }
  }

  get front() { return this.$front; }

  set up(newVal) {
    if (!isEqualArray(newVal, this.$up)) {
      this.$up = newVal;
      this.$dirtyView = true;
    }
  }

  get up() { return this.$up; }

  // 每帧都会获取，这里通过比较值是否更改来减少计算
  get viewMat4() {
    if (this.$dirtyView) {
      mat4.lookAt(
        this.$viewMat4,
        vec3.fromValues(this.$position),
        vec3.fromValues(this.$front),
        vec3.fromValues(this.$up),
      );
    }
    return this.$viewMat4;
  }

  set fov(newVal) {
    if (!isEqualArray(newVal, this.$fov)) {
      this.$fov = newVal;
      this.$dirtyPers = true;
    }
  }

  get fov() { return this.$fov; }

  set aspect(newVal) {
    if (!isEqualArray(newVal, this.$aspect)) {
      this.$aspect = newVal;
      this.$dirtyPers = true;
    }
  }

  get aspect() { return this.$aspect; }

  set near(newVal) {
    if (!isEqualArray(newVal, this.$near)) {
      this.$near = newVal;
      this.$dirtyPers = true;
    }
  }

  get near() { return this.$near; }

  set far(newVal) {
    if (!isEqualArray(newVal, this.$far)) {
      this.$far = newVal;
      this.$dirtyPers = true;
    }
  }

  get far() { return this.$far; }

  get perspectiveMat4() {
    if (this.$dirtyPers) {
      mat4.perspective(this.$persMat4, this.$fov, this.$aspect, this.$near, this.$far);
    }
    return this.$persMat4;
  }

  onBeforeFrame(env) {
    const { shader } = env;
    shader.setMat4('perspective', this.perspectiveMat4);
  }
}
