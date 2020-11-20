import Shader from '../index';
import vsSource from './light.vert.glsl';
import fsSource from './light.frag.glsl';

export default class LightShader extends Shader {
  constructor({ gl }) {
    super({
      gl,
      vsSource,
      fsSource,
      autoCompile: false,
    });
  }
}
