export default class Scene {
  constructor({
    skybox,
    gameObjects = [],
    lightSetting,
  } = {}) {
    this.gameObjects = gameObjects;
    this.skybox = skybox;
    this.lightSetting = lightSetting;
  }

  addGameObject(gameObj) { this.gameObjects.push(gameObj); }
}
