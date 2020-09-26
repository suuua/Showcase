import Shader from '../index';
import vsSource from './vertex.glsl';
import fsSource from './fragment.glsl';

const glMatrix = require('gl-matrix');

const { mat4, vec3, quat } = glMatrix;

/**
 * 向GPU传数据 TODO: transform skinMesh
 * @param {GameObject} gameObject
 * @param {Object} parentData 需要用到的parent数据，例如在坐标变换时要用到
 */
function setGpuData(gl, gameObject, parentData = {}) {
  const {
    children,
    mesh,
    matrix,
  } = gameObject;
  let parentModelMartix = parentData.modelMartix;
  if (!parentModelMartix) {
    // 创建一个坐标原点的变换矩阵
    parentModelMartix = mat4.create();
    mat4.fromRotationTranslationScale(
      parentModelMartix,
      quat.fromValues(0, 0, 0, 1),
      vec3.fromValues(0, 0, 0),
      vec3.fromValues(1, 1, 1),
    );
  }

  const modelMartix = mat4.create();
  mat4.multiply(modelMartix, parentModelMartix, matrix);

  let result = [];
  if (mesh) {
    const { primitives } = mesh;
    primitives.forEach((primitive) => {
      const { position, indices, normal } = primitive;
      const VAO = gl.createVertexArray();
      gl.bindVertexArray(VAO);

      const VBOP = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, VBOP);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        position.typeArray,
        gl.STATIC_DRAW,
      );
      gl.vertexAttribPointer(0, position.size, gl[position.type], false, position.stride, 0);
      gl.enableVertexAttribArray(0);

      const EBO = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, EBO);
      gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        indices.typeArray,
        gl.STATIC_DRAW,
      );

      if (normal) {
        const VBON = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, VBON);
        gl.bufferData(
          gl.ARRAY_BUFFER,
          normal.typeArray,
          gl.STATIC_DRAW,
        );
        gl.vertexAttribPointer(1, normal.size, gl[normal.type], false, normal.stride, 0);
        gl.enableVertexAttribArray(1);
      }
      // TODO textcoord weight joint
      result.push({
        VAO,
        size: indices.typeArray.length,
        modelMartix,
      });
    });
  }
  // 从父到子渲染
  if (children) {
    children.forEach((child) => {
      const VAOS = setGpuData(gl, child, { modelMartix });
      result = result.concat(VAOS);
    });
  }
  return result;
}

function getCamera(scene) {
  const { gameObjects } = scene;
  const obj = gameObjects.find((gameObj) => gameObj.isCamera);
  return obj.components.find((component) => component.tag === 'camera');
}

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

  setGpuData(scene) {
    const gl = this.$gl;
    const { gameObjects } = scene;

    this.use();

    let drawObjs = [];
    gameObjects.forEach((gameObj) => {
      const VAOS = setGpuData(gl, gameObj, {});
      drawObjs = drawObjs.concat(VAOS);
    });
    // const textureSource = gameObject.textures[0];
    // const texture = gl.createTexture();
    // gl.bindTexture(gl.TEXTURE_2D, texture);
    // gl.texImage2D(
    //   gl.TEXTURE_2D, 0, gl.RGB,
    //   textureSource.width, textureSource.height,
    //   0, gl.RGB, gl.UNSIGNED_BYTE,
    //   textureSource.data,
    // );
    // // gl.generateMipmap(gl.TEXTURE_2D);
    // // set texture wrapping to GL_REPEAT (default wrapping method)
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    // // set texture filtering parameters
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // this.use();
    // gl.uniform1i(gl.getUniformLocation(this.$shaderProgram, 'ourTexture'), 0);
    // this.drawParams.VAO = VAO;
    // this.drawParams.texture = texture;
    return drawObjs;
  }

  /**
   * 绘制函数，每帧都会渲染一次
   */
  draw(scene) {
    const gl = this.$gl;
    const drawObjs = this.setGpuData(scene);
    const camera = getCamera(scene);
    this.setMat4('perspective', camera.perspectiveMat4);
    const frame = () => {
      gl.clearColor(0, 0, 0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      // gl.activeTexture(gl.TEXTURE0);
      // gl.bindTexture(gl.TEXTURE_2D, this.drawParams.texture);
      this.use();
      this.setMat4('view', camera.viewMat4);
      drawObjs.forEach((objs) => {
        gl.bindVertexArray(objs.VAO);
        this.setMat4('model', objs.modelMartix);
        /**
         * 这里文档中说使用gl.getExtension('OES_element_index_uint');时必须设置类型为gl.UNSIGNED_INT
         * 另外如果使用UNSIGNED_INT会导致报错“GL_INVALID_OPERATION: Insufficient buffer size.”
         */
        gl.drawElements(gl.TRIANGLES, objs.size, gl.UNSIGNED_SHORT, 0);
      });
      window.requestAnimationFrame(frame);
    };

    console.log('standard shader draw', scene, drawObjs);
    window.requestAnimationFrame(frame);
  }
}
