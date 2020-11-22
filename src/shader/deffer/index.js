import DepthShading from '../depth';

import GBufferShader from './gbuffer';
import LightShader from './light';

export default class Shading {
  constructor({ gl }) {
    this.$gl = gl;
    this.gBufferShader = new GBufferShader({ gl });
    this.lightShader = new LightShader({ gl });
  }

  draw(scene) {
    const gl = this.$gl;
    const SCR_WIDTH = gl.canvas.width;
    const SCR_HEIGHT = gl.canvas.height;
    const camera = scene.getCameraComponent();
    camera.aspect = SCR_WIDTH / SCR_HEIGHT;
    const [lightDirectionComponent] = scene.filterLightDirectionComponents();
    const lightSpotComponents = scene.filterLightSpotComponents();
    scene.callHook('onBeforeRender');
    let shader = this.gBufferShader;
    // calc depth map
    const depthShading = new DepthShading({ gl });
    // set gBuffer pass data
    shader.use();
    let renderObjects = [];
    scene.eachMeshComponents((component) => {
      renderObjects = renderObjects.concat(
        component.setMeshRenderData({ shader }),
      );
    });

    // set light pass data
    const plainVAO = this.lightShader.createStandardPlainMesh();
    shader = this.lightShader;
    // const lightPointComponents = scene.filterLightPointComponents();
    shader.compileProgram(null, {
      POINT_LIGHT_COUNT: lightSpotComponents.length,
      SPOT_LIGHT_COUNT: 1,
    });
    const [
      FBO,
      gPosition,
      gNormal,
      gAlbedoSpec,
      RBODepth,
      gDepth,
    ] = this.gBufferShader.createFrameBuffer();
    shader.use();
    // set texture
    shader.setInt('gPosition', 0);
    shader.setInt('gNormal', 1);
    shader.setInt('gAlbedoSpec', 2);
    shader.setInt('gDepth', 3);
    shader.setInt('shadowMap', 4);
    // set directional light
    shader.setVec3('dirLight.direction', lightDirectionComponent.direction);
    shader.setVec3('dirLight.color', lightDirectionComponent.color);
    shader.setFloat('dirLight.intensity', lightDirectionComponent.intensity);
    lightSpotComponents.forEach((component, index) => {
      const name = `spotLights[${index}]`;
      shader.setVec3(`${name}.position`, component.position);
      shader.setVec3(`${name}.direction`, component.direction);
      shader.setVec3(`${name}.color`, component.color);
      shader.setFloat(`${name}.intensity`, component.intensity);
      shader.setFloat(`${name}.range`, component.range);
      // 为了方便 fragment计算，转为cos值
      shader.setFloat(`${name}.innerConeAngle`, Math.cos(component.innerConeAngle));
      shader.setFloat(`${name}.outerConeAngle`, Math.cos(component.outerConeAngle));
    });

    // set gl status
    gl.enable(gl.DEPTH_TEST);
    // frame
    let preFrameTime = +new Date();
    const frame = () => {
      const time = +new Date();
      const deltaTime = (time - preFrameTime) / 1000;
      preFrameTime = time;
      const input = gl.canvas.$showcaseInput.processInput();
      const env = { input, deltaTime };
      scene.callHook('onRenderFrameStart', { env });
      gl.clearColor(0, 0, 0, 1.0);
      // GBuffer start
      shader = this.gBufferShader;
      shader.use();
      gl.bindFramebuffer(gl.FRAMEBUFFER, FBO);
      // eslint-disable-next-line
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      shader.setMat4('cameraSpaceMartix', camera.spaceMat4);
      // render GameObject
      renderObjects.forEach(({
        baseColorTexture,
        baseColorFactor,
        VAO,
        modelMartix,
        size,
      }) => {
        if (baseColorTexture) {
          shader.setInt('baseColorTex', 0);
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, baseColorTexture);
          shader.setVec4('baseColorFactor', baseColorFactor);
        }
        gl.bindVertexArray(VAO);
        shader.setMat4('model', modelMartix);
        /**
         * 这里文档中说使用gl.getExtension('OES_element_index_uint');时必须设置类型为gl.UNSIGNED_INT
         * 另外如果使用UNSIGNED_INT会导致报错“GL_INVALID_OPERATION: Insufficient buffer size.”
         */
        gl.drawElements(gl.TRIANGLES, size, gl.UNSIGNED_SHORT, 0);
      });
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      // GBuffer END

      // backing shadow start
      const shadowMap = depthShading.draw(scene);
      // backing shadow end

      // light shading start
      shader = this.lightShader;
      shader.use();
      // eslint-disable-next-line
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, gPosition);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, gNormal);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, gAlbedoSpec);
      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_2D, gDepth);
      gl.activeTexture(gl.TEXTURE4);
      gl.bindTexture(gl.TEXTURE_2D, shadowMap);
      // set camera data
      shader.setVec3('viewPos', camera.position);
      gl.bindVertexArray(plainVAO);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.bindVertexArray(null);
      // light shading END

      // copy depth to default buffer
      // gl.bindFramebuffer(gl.READ_FRAMEBUFFER, FBO);
      // gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
      // gl.blitFramebuffer(
      //   0,
      //   0,
      //   SCR_WIDTH,
      //   SCR_HEIGHT,
      //   0,
      //   0,
      //   SCR_WIDTH,
      //   SCR_HEIGHT,
      //   gl.DEPTH_BUFFER_BIT,
      //   gl.NEAREST,
      // );
      // gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      scene.callHook('onRenderFrame', { env });
      scene.callHook('onRenderFrameEnd', { env });
      window.requestAnimationFrame(frame);
    };
    window.requestAnimationFrame(frame);
  }
}
