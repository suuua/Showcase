// import Interator from './interator';
// import Visitor from './visitor';

const TAG_LIGHT_SPOT = 'LightSpot';
const TAG_LIGHT_POINT = 'LightPoint';
const TAG_LIGHT_DIRECTION = 'LightDirection';

function interatorGameObjects(gameObjects, handler) {
  gameObjects.forEach((obj) => {
    handler(obj);
    if (obj.children.length > 0) {
      interatorGameObjects(obj.children, handler);
    }
  });
}

function eachComponentType(gameObjects, type, handler) {
  interatorGameObjects(gameObjects, ({ components }) => {
    components.forEach((component) => {
      if (component.tag === type) {
        handler(component);
      }
    });
  });
}

function filterComponentType(gameObjects, type) {
  const result = [];
  interatorGameObjects(gameObjects, ({ components }) => {
    components.forEach((component) => {
      if (component.tag === type) {
        result.push(component);
      }
    });
  });
  return result;
}

function findGameObject(gameObjects, judge) {
  for (let i = 0; i < gameObjects.length; i += 1) {
    const obj = gameObjects[i];
    if (judge(obj)) { return obj; }
    if (obj.children.length > 0) {
      const findChild = findGameObject(obj.children, judge);
      if (findChild) { return findChild; }
    }
  }
  return null;
}

function findComponent(gameObjects, judge) {
  for (let i = 0; i < gameObjects.length; i += 1) {
    const obj = gameObjects[i];
    const { components } = obj;
    for (let j = 0; j < components.length; j += 1) {
      const component = components[j];
      if (judge(component)) { return component; }
    }
    if (obj.children.length > 0) {
      const fildChild = findComponent(obj.children, judge);
      if (fildChild) { return fildChild; }
    }
  }
  return null;
}

export default class Scene {
  constructor({
    name,
    skybox,
  } = {}) {
    this.gameObjects = [];

    this.name = name;
    this.skybox = skybox;

    // this.interator = new Interator(this);
    // this.visitor = new Visitor(this);
  }

  addGameObject(gameObj) { this.gameObjects.push(gameObj); }

  /* iterator START */

  eachGameObjects(handler) {
    interatorGameObjects(this.gameObjects, handler);
  }

  eachLights(handler) {
    interatorGameObjects(this.gameObjects, (node) => {
      if (node.isLight) { handler(node); }
    });
  }

  eachComponents(handler) {
    interatorGameObjects(this.gameObjects, ({ components }) => {
      components.forEach(handler);
    });
  }

  eachMeshComponents(handler) {
    eachComponentType(this.gameObjects, 'Mesh', handler);
  }

  filterLightSpotComponents() {
    return filterComponentType(this.gameObjects, TAG_LIGHT_SPOT);
  }

  filterLightPointComponents() {
    return filterComponentType(this.gameObjects, TAG_LIGHT_POINT);
  }

  filterLightDirectionComponents() {
    return filterComponentType(this.gameObjects, TAG_LIGHT_DIRECTION);
  }

  findGameObject(judge) {
    return findGameObject(this.gameObjects, judge);
  }

  findComponent(judge) {
    return findComponent(this.gameObjects, judge);
  }

  getCameraComponent() {
    return findComponent(this.gameObjects, (c) => c.tag === 'Camera');
  }

  /* iterator END */

  countLightSpot() {
    let count = 0;
    this.eachGameObjects((obj) => {
      const lightComponent = { obj };
      if (lightComponent && lightComponent.tag === 'LightSpot') {
        count += 1;
      }
    });
    return count;
  }

  countLightPoint() {
    let count = 0;
    this.eachGameObjects((obj) => {
      const lightComponent = { obj };
      if (lightComponent && lightComponent.tag === 'LightPoint') {
        count += 1;
      }
    });
    return count;
  }

  callHook(hookName, options) {
    this.eachComponents((component) => {
      if (component[hookName]) { component[hookName](options); }
    });
  }
}
