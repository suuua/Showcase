function interatorGameObjects(gameObjects, handler) {
  gameObjects.forEach((obj) => {
    handler(obj);
    if (gameObjects.children.length > 0) {
      interatorGameObjects(gameObjects.children, handler);
    }
  });
}

function findGameObject(gameObjects, judge) {
  for (let i = 0; i < gameObjects.length; i += 1) {
    const obj = gameObjects[i];
    if (judge(obj)) { return obj; }
    if (gameObjects.children.length > 0) {
      return findGameObject(gameObjects.children, judge);
    }
  }
  return null;
}

function findComponent(gameObjects, judge) {
  for (let i = 0; i < gameObjects.length; i += 1) {
    const { components } = gameObjects[i];
    for (let j = 0; j < components.length; j += 1) {
      const component = components[j];
      if (judge(component)) { return component; }
    }
    if (gameObjects.children.length > 0) {
      return findComponent(gameObjects.children, judge);
    }
  }
  return null;
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

  eachMeshComponents(handler) {
    interatorGameObjects(this.scene.gameObjects, ({ components }) => {
      components.forEach((component) => {
        if (component.tag === 'Mesh') {
          handler(component);
        }
      });
    });
  }

  findGameObject(judge) {
    return findGameObject(this.scene.gameObjects, judge);
  }

  findComponent(judge) {
    return findComponent(this.scene.gameObjects, judge);
  }

  getCameraComponent() {
    return this.findComponent((c) => c.tag === 'Camera');
  }
}
