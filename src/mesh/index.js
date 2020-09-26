/**
 * 基于GLTF文件结构设计
 */

export default class Mesh {
  constructor() {
    // TODO: material
    // 网格可能会被分割，所以实际网格是一个数组
    this.primitives = [];
    this.GPUCache = [];
  }

  addPrimitive(infos) {
    this.primitives.push(infos);
  }
}
