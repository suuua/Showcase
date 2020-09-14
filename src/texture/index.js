/**
 * 纹理类别，会有光照，反射，高度等纹理类型
 */
export default class Texture {
  constructor({ data, width, height }) {
    this.data = data;
    this.width = width;
    this.height = height;
  }
}
