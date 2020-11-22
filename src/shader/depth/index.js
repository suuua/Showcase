import DirectionSpotShader from './directionSpot';
import DisplayShader from './display';
import Merge2DMapsShader from './merge2DMaps';

export default class Shading {
  constructor({ gl }) {
    this.$gl = gl;
    this.$ldShader = new DirectionSpotShader({ gl });
    this.$dDepthMapInfos = null;
    this.$mergeShader = new Merge2DMapsShader({ gl });

    this.$debugPlayer = new DisplayShader({ gl });
  }

  // calc depth map
  draw(scene) {
    const gl = this.$gl;
    const { width, height } = gl.canvas;
    const viewPortWidth = scene.diagonalPixel;

    gl.viewport(0, 0, viewPortWidth, viewPortWidth);
    if (!this.$dDepthMapInfos) {
      this.$dDepthMapInfos = this.$ldShader.draw(scene);
    }

    // TODO: point light

    const depthMap = this.$mergeShader.draw(scene, this.$dDepthMapInfos);
    // this.$debugPlayer.draw({ depthMap });

    // 恢复默认大小
    gl.viewport(0, 0, width, height);
    return depthMap;
  }
}
