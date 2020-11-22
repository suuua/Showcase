import Light from './base';

const { vec3, quat, mat4 } = require('gl-matrix');

export default class LightDirectional extends Light {
  constructor(opt) {
    super(opt);
    this.tag = 'LightDirection';
    // TODO：这个参数是太阳光的角直径？
    this.rotation = opt.rotation;
    //  this.$fakePosition = [10, 10, 10];

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

  /**
   * 在阴影过程中会使用到的View矩阵
   * 在平行光源中，光源的位置和视锥体只会影响阴影渲染的区域和渲染的质量
   * TODO：这里应该根据场景大小来计算视图，投影矩阵
   */
  getViewMat4({ position }) {
    const vecPos = vec3.fromValues(...position);
    const rotateTarget = vec3.create();
    vec3.add(rotateTarget, vecPos, this.direction);

    const { rotation } = this.parent;
    const up = vec3.fromValues(0, 0, -1);
    vec3.transformQuat(up, up, quat.fromValues(...rotation));
    vec3.normalize(up, up);

    mat4.lookAt(
      this.$viewMat4,
      vecPos,
      vec3.fromValues(...rotateTarget),
      vec3.fromValues(...up),
    );
    return this.$viewMat4;
  }

  /**
   * 在阴影过程使用到的基于光照坐标空间的LookAt矩阵，
   * 平行光光源位置可能在无限远处，这里应该选择一个合适的位置
   */
  // eslint-disable-next-line
  getPerspectiveMat4({ width }) {
    const size = Math.ceil(width);
    mat4.ortho(this.$persMat4, -size, size, -size, size, 0.01, size * 3);
    return this.$persMat4;
  }

  getSpaceMat4({ width, position }) {
    const lightSpaceMatrix = mat4.create();
    mat4.multiply(
      lightSpaceMatrix,
      this.getPerspectiveMat4({ width }),
      this.getViewMat4({ position }),
    );
    return lightSpaceMatrix;
  }
}
