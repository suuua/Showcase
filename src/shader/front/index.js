import Shader from '../index';
import vsSource from './vertex.glsl';
import fsSource from './fragment.glsl';

export default class StandardShader extends Shader {
  constructor({ gl }) {
    super({ gl, vsSource, fsSource });
    this.version = '0.0.1';
    // shader 需要的参数
    this.params = {
      vertices: null,
      textures: null,
      indices: null,
    };
    this.drawParams = {};
  }

  // eslint-disable-next-line
  get description() {
    return {
      baseColor: 'texture1',
      baseColorFactor: 'baseColorFactor',
    };
  }

  /**
   * 绘制函数，每帧都会渲染一次
   */
  draw(scene) {
    const gl = this.$gl;
    this.use();
    scene.callHook('onBeforeRender');
    gl.enable(gl.DEPTH_TEST);
    const camera = scene.getCameraComponent();
    const [lightDirectionComponent] = scene.filterLightDirectionComponents();
    const lightSpotComponents = scene.filterLightSpotComponents();
    // set mesh data
    let renderObjects = [];
    scene.eachMeshComponents((component) => {
      renderObjects = renderObjects.concat(
        component.setMeshRenderData({ shader: this }),
      );
    });
    // set direction light
    this.setVec3('dirLight.direction', lightDirectionComponent.direction);
    this.setVec3('dirLight.color', lightDirectionComponent.color);
    this.setFloat('dirLight.intensity', lightDirectionComponent.intensity);
    // set spotLight
    lightSpotComponents.forEach((component, index) => {
      const structIndex = `spotLights[${index}]`;
      this.setVec3(`${structIndex}.position`, component.position);
      this.setVec3(`${structIndex}.direction`, component.direction);
      this.setVec3(`${structIndex}.color`, component.color);
      this.setFloat(`${structIndex}.intensity`, component.intensity);
      this.setFloat(`${structIndex}.range`, component.range);
      // 为了方便 fragment计算，转为cos值
      this.setFloat(`${structIndex}.innerConeAngle`, Math.cos(component.innerConeAngle));
      this.setFloat(`${structIndex}.outerConeAngle`, Math.cos(component.outerConeAngle));
    });
    let preFrameTime = +new Date();
    const frame = () => {
      const time = +new Date();
      const deltaTime = (time - preFrameTime) / 1000;
      preFrameTime = time;
      const input = gl.canvas.$showcaseInput.processInput();
      const env = {
        input,
        deltaTime,
      };
      scene.callHook('onRenderFrameStart', { env });
      gl.clearColor(0, 0, 0, 1.0);
      // eslint-disable-next-line
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      this.setMat4('perspective', camera.perspectiveMat4);
      this.setMat4('view', camera.viewMat4);
      this.setVec3('viewPos', camera.position);

      // render GameObject
      renderObjects.forEach(({
        baseColorTexture,
        VAO,
        modelMartix,
        size,
      }) => {
        if (baseColorTexture) {
          this.setInt('baseColorTex', 0);
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, baseColorTexture);
        }
        gl.bindVertexArray(VAO);
        this.setMat4('model', modelMartix);
        /**
         * 这里文档中说使用gl.getExtension('OES_element_index_uint');时必须设置类型为gl.UNSIGNED_INT
         * 另外如果使用UNSIGNED_INT会导致报错“GL_INVALID_OPERATION: Insufficient buffer size.”
         */
        gl.drawElements(gl.TRIANGLES, size, gl.UNSIGNED_SHORT, 0);
      });
      scene.callHook('onRenderFrame', { env });
      scene.callHook('onRenderFrameEnd', { env });
      window.requestAnimationFrame(frame);
    };
    window.requestAnimationFrame(frame);
  }
}
