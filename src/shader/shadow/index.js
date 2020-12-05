import DirectionSpotShader from './directionSpot';
import PointShader from './point';
import ToCameraSpace from './toCameraSpace';

export default class Shading {
  constructor({ gl }) {
    this.$gl = gl;
    this.$ldShader = new DirectionSpotShader({ gl });
    this.$pointShader = new PointShader({ gl });
    this.$depthMapInfos = null;
    this.$toCameraSpaceShader = new ToCameraSpace({ gl });
  }

  // calc depth map
  draw(scene, { sendGpuDataVisitor }) {
    const gl = this.$gl;
    const { width, height } = gl.canvas;
    const viewPortWidth = scene.diagonalPixel;

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.FRONT);
    gl.colorMask(false, false, false, false);
    gl.viewport(0, 0, viewPortWidth, viewPortWidth);
    if (!this.$depthMapInfos) {
      const depthMapsDS = this.$ldShader.draw(scene, { sendGpuDataVisitor });
      const pointDepthMaps = this.$pointShader.draw(scene, { sendGpuDataVisitor });
      this.$depthMapInfos = [...depthMapsDS, ...pointDepthMaps];
    }
    gl.cullFace(gl.BACK);
    gl.disable(gl.CULL_FACE);
    gl.colorMask(true, true, true, true);

    const cameraSpaceShadowTexture = this.$toCameraSpaceShader.draw(scene, {
      sendGpuDataVisitor,
      depthMapInfos: this.$depthMapInfos,
    });
    // 恢复默认大小
    gl.viewport(0, 0, width, height);
    return cameraSpaceShadowTexture;
  }
}
