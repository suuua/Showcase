import Light from './base';

const { vec3, quat, mat4 } = require('gl-matrix');

let lightPointId = 0;

export default class LightSpot extends Light {
  constructor(infos) {
    super(infos);
    this.tag = 'LightSpot';
    this.type = 2;
    // range 为0 代表光源为无穷范围
    this.range = infos.range || 0;
    // 注意这里是半角
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

  getSpaceMat4({ width, aspect }) {
    const vecPos = vec3.fromValues(...this.position);
    const persMat4 = mat4.create();
    mat4.perspective(
      persMat4,
      this.outerConeAngle * 2,
      aspect || 1,
      0.1,
      this.range || Math.ceil(width) * 10,
    );

    const target = vec3.create();
    vec3.add(target, vecPos, this.direction);

    const { rotation } = this.parent;
    const up = vec3.fromValues(0, 0, -1);
    vec3.transformQuat(up, up, quat.fromValues(...rotation));
    vec3.normalize(up, up);

    const viewMat4 = mat4.create();
    mat4.lookAt(
      viewMat4,
      vecPos,
      target,
      up,
    );

    const lightSpaceMatrix = mat4.create();
    mat4.multiply(
      lightSpaceMatrix,
      persMat4,
      viewMat4,
    );
    return lightSpaceMatrix;
  }
}
