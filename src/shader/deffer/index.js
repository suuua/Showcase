import GBufferShader from './gbuffer';
import LightShader from './light';
import Ambient from './ambient';

export default class DefferShading {
  constructor({ gl }) {
    this.$gl = gl;
    this.$gBufferShader = new GBufferShader({ gl });
    this.$lightShader = new LightShader({ gl });
    this.$ambientShader = new Ambient({ gl });
  }

  draw(scene, { shadowInfos, sendGpuDataVisitor }) {
    const gTexture = this.$gBufferShader.draw(scene, { sendGpuDataVisitor });
    const loTexture = this.$lightShader.draw(scene, { ...gTexture, shadowInfos });
    return this.$ambientShader.draw(scene, {
      loTexture,
      albedoOcclusionTexture: gTexture.albedoOcclusionTexture,
    });
  }
}
