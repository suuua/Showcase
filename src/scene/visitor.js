export default class Visitor {
  constructor(scene) {
    this.scene = scene;
  }

  callHook(hookName, options) {
    this.scene.interator.eachComponents((component) => {
      if (component[hookName]) { component[hookName](options); }
    });
  }
}
