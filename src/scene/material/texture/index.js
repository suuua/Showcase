import Texture from './base';
import NormalTexture from './normalTexture';
import OcclusionTexture from './occlusionTexture';

function createDefaultTextureSource() {
  const SIZE = 10;
  const canvas = document.createElement('canvas');
  canvas.id = 'sc_default_texture';
  canvas.height = SIZE;
  canvas.width = SIZE;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, SIZE, SIZE);
  return canvas;
}

Texture.NormalTexture = NormalTexture;
Texture.OcclusionTexture = OcclusionTexture;

const imgElm = createDefaultTextureSource();
Texture.DEFAULT = new Texture({
  source: {
    imgElm,
    width: imgElm.width,
    height: imgElm.height,
    name: 'defaultMaterial',
  },
  texCoord: 0,
});

export default Texture;
