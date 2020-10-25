import Light from './base';

const { vec3, quat } = require('gl-matrix');

let lightPointId = 0;

export default class LightSpot extends Light {
  constructor(infos) {
    super(infos);
    this.range = infos.range || 0;
    this.innerConeAngle = infos.spot.innerConeAngle || 0;
    this.outerConeAngle = infos.spot.outerConeAngle || Math.PI / 4;

    this.$lightPointId = lightPointId;
    lightPointId += 1;
  }

  get direction() {
    const defaultDir = vec3.fromValues(0, -1, 0);
    const direction = vec3.create();
    vec3.transformQuat(direction, defaultDir, quat.fromValues(...this.parent.rotation));
    vec3.normalize(direction, direction);
    return direction;
  }

  onBeforeRender({ shader }) {
    const structIndex = `spotLights[${this.$lightPointId}]`;
    shader.setVec3(`${structIndex}.position`, this.parent.translation);
    shader.setVec3(`${structIndex}.direction`, this.direction);
    shader.setVec3(`${structIndex}.color`, this.color);
    shader.setFloat(`${structIndex}.intensity`, this.intensity / Light.UNIT_INTENSITY_LUM);
    shader.setFloat(`${structIndex}.range`, this.range);
    // 为了方便 fragment计算，转为cos值
    shader.setFloat(`${structIndex}.innerConeAngle`, Math.cos(this.innerConeAngle));
    shader.setFloat(`${structIndex}.outerConeAngle`, Math.cos(this.outerConeAngle));
  }
}
