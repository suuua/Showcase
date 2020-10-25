import Component from '../index';

const { mat4, vec3, quat } = require('gl-matrix');

/**
 * 父GameObject的位置仅影响 点光源，聚光源，对平行光没有影响；旋转对光的角度有影响
 * TODO：面光源
 */
export default class Light extends Component {
  constructor({
    color = [1.0, 1.0, 1.0],
    parent,
    intensity = 1,
    // type,
  } = {}) {
    super({ parent });
    this.color = [...color];
    // intensity需要统一单位，这里先设为 1 = 8000lx (阴天下的光照度)
    // 关于描述光的三个单位（lm，cd，lx）
    this.intensity = intensity;
    this.tag = 'Light';
  }

  /**
   * 将以能量w为单位的光照强度转为cd(lum/sr)
   * 规定，功率为1W的555nm波长单色光，对应的光通量为683流明。
   * @param {Number} w 能量
   * @returns {Number} cd
   */
  static transWToCd(w) {
    return (w * 683) / (2 * Math.PI);
  }

  // 这个值暂时还不知道取什么好
  static get UNIT_INTENSITY_LUM() { return 2000; }
}
