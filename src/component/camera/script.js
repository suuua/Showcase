import { quatToEuler, radianToAngle } from '../../helper';
import Component from '../index';

const { vec3, quat } = require('gl-matrix');

export default class MoveScript extends Component {
  constructor({ parent } = {}) {
    super({ parent });
    this.tag = 'CameraMoveScript';
  }

  onBeforeRender() {
    this.camera = this.parent.getComponent('Camera');
  }

  onRenderFrame({ env }) {
    const { rotation, translation } = this.parent;
    const { input, deltaTime } = env;
    const {
      KeyW, KeyS, KeyD, KeyA,
    } = input.key;
    // camera move
    if (KeyW || KeyS || KeyD || KeyA) {
      const { up, rotateFront } = this.camera;
      const cameraSpeed = 5 * deltaTime;
      const quatRotate = quat.fromValues(...rotation);
      const cameraDir = rotateFront;
      let targetPosition = [...translation];
      if (KeyW || KeyS) {
        targetPosition = cameraDir.map(
          (l, key) => targetPosition[key] + ((KeyW ? l : 0) + (KeyS ? -l : 0)) * cameraSpeed,
        );
      }

      if (KeyD || KeyA) {
        const moveDir = vec3.create();
        const cameraUp = vec3.fromValues(...up);
        const upDir = vec3.create();
        vec3.transformQuat(upDir, cameraUp, quatRotate);
        vec3.cross(moveDir, cameraDir, upDir);
        targetPosition = [...moveDir].map(
          (l, key) => targetPosition[key] + ((KeyD ? l : 0) + (KeyA ? -l : 0)) * cameraSpeed,
        );
      }
      this.parent.setTransform([...targetPosition]);
    }

    // camera rotate
    if (input.deltaMouseMoveX || input.deltaMouseMoveY) {
      const sensitivity = 0.5;
      // const sourceQuat = quat.fromValues(...rotation);
      const sourceEuler = quatToEuler(rotation).map((r) => radianToAngle(r).toFixed(3) * 1);
      const targetQuat = quat.create();
      if (input.deltaMouseMoveX) {
        sourceEuler[1] -= input.deltaMouseMoveX * sensitivity;
      }
      if (input.deltaMouseMoveY) {
        sourceEuler[0] -= input.deltaMouseMoveY * sensitivity;
        if (sourceEuler[0] > 60) { sourceEuler[0] = 60; }
        if (sourceEuler[0] < -60) { sourceEuler[0] = -60; }
      }
      // 限定不滚动，滚动的话会导致pitch趋于30deg 时会产生旋转
      sourceEuler[2] = 0;
      quat.fromEuler(targetQuat, ...sourceEuler);
      this.parent.setTransform(undefined, [...targetQuat]);
    }
  }
}
