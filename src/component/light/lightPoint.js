import Light from './base';

let lightPointId = 0;

// TODO： 点光源的光源大小对光照的影响
export default class LightPoint extends Light {
  constructor(infos) {
    super(infos);
    // https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_lights_punctual/README.md
    this.range = infos.range || 0;
    this.$lightPointId = lightPointId;
    lightPointId += 1;
  }

  onBeforeRender({ shader }) {
    const structIndex = `pointLights[${this.$lightPointId}]`;
    shader.setVec3(`${structIndex}.position`, this.parent.translation);
    shader.setVec3(`${structIndex}.color`, this.color);
    shader.setFloat(`${structIndex}.intensity`, this.intensity / Light.UNIT_INTENSITY_LUM);
    shader.setFloat(`${structIndex}.range`, this.range);
  }
}
