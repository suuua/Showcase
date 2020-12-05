import Texture from './base';

export default class NormalTexture extends Texture {
  constructor(infos) {
    super(infos);
    this.scale = infos.scale || 1;
  }
}
