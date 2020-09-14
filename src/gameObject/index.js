/**
 * 游戏对象的结构待定。需要依据模型文件来设计
 * material和shader是互相依赖的关系，shader决定GameObject需要什么数据，可用什么选项。shader需要GameObject的数据。
 */

export default class GameObject {
  constructor({
    transform,
    mesh,
    material,
    shaderName,
  }) {
    // 这些参数以后需要归并到组件当中去。
    this.transform = transform;
    // 这里应该是网格数据，方便测试先直接填入顶点数据
    this.mesh = mesh;
    this.mesh = [
      0.5, 0.5, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0,
      0.5, -0.5, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0,
      -0.5, -0.5, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0,
      -0.5, 0.5, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0,
    ];
    this.indices = [0, 1, 3, 1, 2, 3];
    this.material = material;
    this.shaderName = shaderName;

    this.$components = [];
  }

  get vertices() {
    return this.mesh;
  }

  get textures() {
    return this.material.textures;
  }

  addComponent(component) {
    this.$components.push(component);
  }

  getComponent(component) {
    return this.$components.find(component);
  }

  deleteComponent(component) {
    return this.$components.splice(this.$components.findIndex(component), 1);
  }
}
