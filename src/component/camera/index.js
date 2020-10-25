/**
 * 用于创建摄像机
 */

import Component from '../index';
import { isEqualArray } from '../../helper';

const { mat4, vec3, quat } = require('gl-matrix');

export default class Camera extends Component {
  constructor({
    // perspective 变换需要参数
    fov = 45,
    aspect = 1,
    near = 0.1,
    far = 100,
    parent,
  } = {}) {
    super({ parent });
    this.$dirtyView = true;
    // front = target - translation
    this.$front = [0, 0, -1];
    // 摄像机在初始位置下，up=wordUp，但如果不在初始情况下，需要根据wordUp重新计算出up分量
    this.$up = [0, 1, 0];
    this.$viewMat4 = mat4.create();

    this.$dirtyPers = true;
    this.$fov = fov;
    this.$aspect = aspect;
    this.$near = near;
    this.$far = far;
    this.$persMat4 = mat4.create();
    // 所属GameObject
    this.tag = 'Camera';
    this.$oldTrans = [];
    this.$oldRotat = [];
  }

  get front() { return [...this.$front]; }

  get up() { return [...this.$up]; }

  get rotateFront() {
    const { rotation } = this.parent;
    const rotatQuate = quat.fromValues(...rotation);
    const rotateFront = vec3.fromValues(...this.front);
    vec3.transformQuat(rotateFront, rotateFront, rotatQuate);
    vec3.normalize(rotateFront, rotateFront);
    return rotateFront;
  }

  get rotateTarget() {
    const { translation } = this.parent;
    const target = vec3.create();
    // front + translation = target;
    vec3.add(target, translation, this.rotateFront);
    return target;
  }

  get rotateUp() {
    const { rotation } = this.parent;
    const up = vec3.fromValues(...this.up);
    vec3.transformQuat(up, up, quat.fromValues(...rotation));
    vec3.normalize(up, up);
    return up;
  }

  // 每帧都会获取，这里通过比较值是否更改来减少计算
  get viewMat4() {
    const { translation, rotation } = this.parent;
    if (
      this.$dirtyView
      || !isEqualArray(this.$oldTrans, translation)
      || !isEqualArray(this.$oldRotat, rotation)
    ) {
      this.$dirtyView = false;
      this.$oldTrans = translation;
      this.$oldRotat = rotation;
      mat4.lookAt(
        this.$viewMat4,
        vec3.fromValues(...translation),
        vec3.fromValues(...this.rotateTarget),
        vec3.fromValues(...this.rotateUp),
      );
      return this.$viewMat4;
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
      this.$dirtyPers = false;
      mat4.perspective(this.$persMat4, this.$fov, this.$aspect, this.$near, this.$far);
    }
    return this.$persMat4;
  }

  onRenderStart(target) {
    const { shader } = target;
    // camera pos
    shader.setMat4('perspective', this.perspectiveMat4);
    shader.setMat4('view', this.viewMat4);
    shader.setVec3('viewPos', this.parent.translation);
  }
}
