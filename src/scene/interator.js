function interatorGameObjects(gameObjects, handler) {
  gameObjects.forEach((obj) => {
    handler(obj);
    if (gameObjects.children.length > 0) {
      interatorGameObjects(gameObjects.children, handler);
    }
  });
}

export default class SceneInterator {
  constructor(scene) {
    this.scene = scene;
  }

  /**
   * interator gameObects
   * @param {Function} handler
   */
  eachGameObjects(handler) {
    interatorGameObjects(this.scene.gameObjects, handler);
  }

  /**
   * iterator light GameObjects
   * @param {Function} handler
   */
  eachLights(handler) {
    interatorGameObjects(this.scene.gameObjects, (node) => {
      if (node.isLight) { handler(node); }
    });
  }

  eachComponents(handler) {
    interatorGameObjects(this.scene.gameObjects, (node) => {
      node.components.forEach((component) => {
        handler(component);
      });
    });
  }
}
