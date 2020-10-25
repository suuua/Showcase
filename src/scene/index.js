import Interator from './interator';
import Visitor from './visitor';

export default class Scene {
  constructor({
    name,
    skybox,
  } = {}) {
    this.gameObjects = [];

    this.name = name;
    this.skybox = skybox;

    this.interator = new Interator(this);
    this.visitor = new Visitor(this);
  }

  addGameObject(gameObj) { this.gameObjects.push(gameObj); }
}
