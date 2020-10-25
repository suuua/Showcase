import Light from './base';

const { vec3, quat, mat4 } = require('gl-matrix');

export default class LightDirectional extends Light {
  constructor(opt) {
    super(opt);
    // 平行光的方向向量
    // TODO：这个参数是太阳光的角直径？
    this.rotation = opt.rotation;
    this.$depthMapMap = new Map();
  }

  get direction() {
    const { rotation } = this.parent;
    // 默认方向为沿 -y 轴方向
    const direction = vec3.fromValues(0, -1, 0);
    vec3.transformQuat(direction, direction, quat.fromValues(...rotation));
    vec3.normalize(direction, direction);
    return direction;
  }

  // 这些计算过程和Camera一样
  get rotateFront() {
    const { rotation } = this.parent;
    const rotatQuate = quat.fromValues(...rotation);
    const rotateFront = vec3.fromValues(...this.direction);
    vec3.transformQuat(rotateFront, rotateFront, rotatQuate);
    vec3.normalize(rotateFront, rotateFront);
    return rotateFront;
  }

  get rotateTarget() {
    const { translation } = this.parent;
    const target = vec3.create();
    vec3.add(target, translation, this.rotateFront);
    return target;
  }

  get rotateUp() {
    const { rotation } = this.parent;
    const up = vec3.fromValues(0, 1, 0);
    vec3.transformQuat(up, up, quat.fromValues(...rotation));
    vec3.normalize(up, up);
    return up;
  }

  get depthMap() { return this.$depthMap; }

  /**
   * 在阴影过程中会使用到的View矩阵
   * 在平行光源中，光源的位置和视锥体只会影响阴影渲染的区域和渲染的质量
   * TODO：如何获得合适的位置和视锥体范围
   */
  // eslint-disable-next-line
  get viewMat4() {
    const viewMat4 = mat4.create();
    mat4.ortho(viewMat4, -10, 10, -10, 10, 0.01, 20);
    return viewMat4;
  }

  // 在阴影过程使用到的基于光照坐标空间的LookAt矩阵
  perspectiveMat4() {
    const viewMat4 = mat4.create();
    mat4.lookAt(
      viewMat4,
      vec3.fromValues(...this.parent.translation),
      vec3.fromValues(...this.rotateTarget),
      vec3.fromValues(...this.rotateUp),
    );
  }

  onBeforeRender({ shader }) {
    shader.setVec3('dirLight.direction', this.direction);
    shader.setVec3('dirLight.color', this.color);
    shader.setFloat('dirLight.intensity', this.intensity);
    const staticDepthMap = this.depthMap.get('static');
    if (staticDepthMap) {

    }
  }
}
