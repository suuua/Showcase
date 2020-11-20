import Light from './base';

const { vec3, quat, mat4 } = require('gl-matrix');

let lightPointId = 0;

export default class LightSpot extends Light {
  constructor(infos) {
    super(infos);
    this.tag = 'LightSpot';
    this.range = infos.range || 0;
    this.innerConeAngle = infos.spot.innerConeAngle || 0;
    this.outerConeAngle = infos.spot.outerConeAngle || Math.PI / 4;

    this.$lightPointId = lightPointId;

    this.intensity = infos.intensity / Light.UNIT_INTENSITY_LUM;

    lightPointId += 1;
  }

  get position() { return [...this.parent.translation]; }

  get direction() {
    const defaultDir = vec3.fromValues(0, -1, 0);
    const direction = vec3.create();
    vec3.transformQuat(direction, defaultDir, quat.fromValues(...this.parent.rotation));
    vec3.normalize(direction, direction);
    return direction;
  }

  // 这些计算过程和Camera一样
  get rotateTarget() {
    const target = vec3.create();
    vec3.add(target, this.position, this.direction);
    return target;
  }

  get rotateUp() {
    const { rotation } = this.parent;
    const up = vec3.fromValues(0, 0, -1);
    vec3.transformQuat(up, up, quat.fromValues(...rotation));
    vec3.normalize(up, up);
    return up;
  }

  viewMat4() {
    const viewMat4 = mat4.create();
    mat4.lookAt(
      viewMat4,
      vec3.fromValues(...this.position),
      vec3.fromValues(...this.rotateTarget),
      vec3.fromValues(...this.rotateUp),
    );
    return viewMat4;
  }

  // eslint-disable-next-line
  perspectiveMat4({ width, height }) {
    const persMat4 = mat4.create();
    mat4.perspective(persMat4, this.outerConeAngle, width / height, 0.01, 50);
    return persMat4;
  }
}
