export default class Joint {
  constructor({
    name,
    children,
    rotation,
    scale,
    translation,
  }) {
    this.name = name;
    this.children = children;
    this.rotation = rotation || [0, 0, 0, 1];
    this.scale = scale || [1, 1, 1];
    this.translation = translation || [0, 0, 0];
  }
}
