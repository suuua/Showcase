import Mesh from './index';

export default class SkinMesh extends Mesh {
  constructor(...args) {
    super(...args);
    this.skin = null;
  }
}
