import Light from './base';

const { vec3, quat, mat4 } = require('gl-matrix');

export default class LightDirectional extends Light {
  constructor(opt) {
    super(opt);
    this.tag = 'LightDirection';
    // TODO：这个参数是太阳光的角直径？
    this.rotation = opt.rotation;
    this.$fakePosition = [10, 10, 10];

    this.$dirtyView = true;
    this.$viewMat4 = mat4.create();

    this.dirtyPers = true;
    this.$persMat4 = mat4.create();
  }

  // 平行光的方向向量
  get direction() {
    const { rotation } = this.parent;
    // 默认方向为沿 -y 轴方向
    const direction = vec3.fromValues(0, -1, 0);
    vec3.transformQuat(direction, direction, quat.fromValues(...rotation));
    vec3.normalize(direction, direction);
    return direction;
  }

  // 这些计算过程和Camera一样
  get rotateTarget() {
    const target = vec3.create();
    vec3.add(target, this.$fakePosition, this.direction);
    return target;
  }

  get rotateUp() {
    const { rotation } = this.parent;
    const up = vec3.fromValues(0, 0, -1);
    vec3.transformQuat(up, up, quat.fromValues(...rotation));
    vec3.normalize(up, up);
    return up;
  }

  /**
   * 在阴影过程中会使用到的View矩阵
   * 在平行光源中，光源的位置和视锥体只会影响阴影渲染的区域和渲染的质量
   * TODO：这里应该根据场景大小来计算视图，投影矩阵
   */
  viewMat4() {
    if (this.$dirtyView) {
      mat4.lookAt(
        this.$viewMat4,
        vec3.fromValues(...this.$fakePosition),
        vec3.fromValues(...this.rotateTarget),
        vec3.fromValues(...this.rotateUp),
      );
    }
    return this.$viewMat4;
  }

  /**
   * 在阴影过程使用到的基于光照坐标空间的LookAt矩阵，
   * 平行光光源位置可能在无限远处，这里应该选择一个合适的位置
   */
  // eslint-disable-next-line
  perspectiveMat4() {
    if (this.dirtyPers) {
      mat4.ortho(this.$persMat4, -20, 20, -20, 20, 0.01, 50);
    }
    return this.$persMat4;
  }
}
