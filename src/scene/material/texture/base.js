export default class Texture {
  constructor({
    source,
    texCoord,
    sampler,
    // TODO:
    // extensions,
    // extras
  }) {
    this.sampler = sampler;
    this.source = source;
    this.texCoord = texCoord;
  }
}
