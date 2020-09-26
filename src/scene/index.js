export default class Scene {
  constructor({
    name,
    skybox,
    gameObjects = [],
    lightSetting,
  } = {}) {
    this.gameObjects = gameObjects;
    this.skybox = skybox;
    this.lightSetting = lightSetting;
    this.name = name;
  }

  addGameObject(gameObj) { this.gameObjects.push(gameObj); }
}
