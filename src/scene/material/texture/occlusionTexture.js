import Texture from './base';

export default class OcclusionTexture extends Texture {
  constructor(infos) {
    super(infos);
    this.strength = infos.strength || 1;
  }
}
