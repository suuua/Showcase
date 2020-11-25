import Light from './base';

let lightPointId = 0;

const { mat4, vec3 } = require('gl-matrix');

// TODO： 点光源的光源大小对光照的影响
export default class LightPoint extends Light {
  constructor(infos) {
    super(infos);
    this.tag = 'LightPoint';
    // https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_lights_punctual/README.md
    this.range = infos.range || 0;
    this.$lightPointId = lightPointId;
    lightPointId += 1;
  }

  get position() { return [...this.parent.translation]; }

  cubeSpaceMat4({ width }) {
    const persMat4 = mat4.create();
    mat4.perspective(
      persMat4,
      Math.cos(Math.PI / 2),
      1,
      0.1,
      this.range || Math.ceil(width) * 10,
    );

    const lookAtParams = [
      [[1, 0, 0], [0, -1, 0]],
      [[-1, 0, 0], [0, -1, 0]],
      [[0, 1, 0], [0, 0, 1]],
      [[0, -1, 0], [0, 0, -1]],
      [[0, 0, 1], [0, -1, 0]],
      [[0, 0, -1], [0, -1, 0]],
    ];

    const result = lookAtParams.map(([direction, up]) => {
      const viewMat4 = mat4.create();
      const position = vec3.fromValues(...this.position);
      const target = vec3.create();
      vec3.add(target, position, direction);
      mat4.lookAt(
        viewMat4,
        position,
        target,
        up,
      );

      const spaceMartix = mat4.create();
      mat4.multiply(
        spaceMartix,
        persMat4,
        viewMat4,
      );

      return spaceMartix;
    });

    return result;
  }
}
