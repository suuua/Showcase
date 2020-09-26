import Loader from './index';
import { warn } from '../helper/log';
// import Texture from '../texture';
// import Material from '../material';
import Mesh from '../mesh';
import SkinMesh from '../mesh/skinMesh';
import GameObject from '../gameObject';
import Scene from '../scene';
import Joint from '../component/joint';
import Camera from '../component/camera';

const bufferMacro = {
  34962: 'ARRAY_BUFFER',
  ARRAY_BUFFER: 34962,
  34963: 'ELEMENT_ARRAY_BUFFER',
  ELEMENT_ARRAY_BUFFER: 34963,
};

const accessorMacro = {
  TYPE_BYTE: 5120,
  TYPE_UNSIGNED_BYTE: 5121,
  TYPE_SHORT: 5122,
  TYPE_UNSIGNED_SHORT: 5123,
  TYPE_UNSIGNED_INT: 5125,
  TYPE_FLOAT: 5126,
  getRawType(componentType) {
    const map = {
      5120: 'BYTE',
      5121: 'UNSIGNED_BYTE',
      5122: 'SHORT',
      5123: 'UNSIGNED_SHORT',
      5125: 'UNSIGNED_INT',
      5126: 'FLOAT',
    };
    return map[componentType];
  },
  getTypeArray(componentType) {
    const map = {
      5120: Int8Array,
      5121: Uint8Array,
      5122: Int16Array,
      5123: Uint16Array,
      5125: Int32Array,
      5126: Float32Array,
    };
    return map[componentType];
  },
  getTypeByte(componentType) {
    const map = {
      5120: 1,
      5121: 1,
      5122: 2,
      5123: 2,
      5125: 4,
      5126: 4,
    };
    return map[componentType];
  },
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16,
};

// function getMAT2FromTypeArray(typeArray) { }
// function getMAT3FromTypeArray(typeArray) { }
// function getMAT4FromTypeArray(typeArray) { }

/**
 * 依据accessor提取buffer中的内容并生成一个新的紧凑buffer
 * buffer内容全错了，需要从新检查下算法
 * @param {Boolean} isPlainAccessor 用来区分是accessor还是sparse中的indices或values
 * @returns {TypeArray}
 */
function extractTypeArray(accessor, totalInfos, ext, isPlainAccessor = true) {
  const { bufferViews } = totalInfos;
  const bufferView = bufferViews[accessor.bufferView];
  const { buffer } = ext.buffers[bufferView.buffer];
  const { byteStride } = bufferView;
  const { componentType, count, type } = accessor;
  const TA = accessorMacro.getTypeArray(componentType);
  const plength = type ? count * accessorMacro[type] : count;
  const accessorOffset = accessor.byteOffset || 0;
  const bufferViewOffset = bufferView.byteOffset || 0;
  const offset = accessorOffset + bufferViewOffset;
  if (isPlainAccessor) {
    const { sparse } = accessor;
    // 如果2个accessor使用同一个bufferView，则bufferView中会有byteStride属性，这里有可能会算错
    // 也可使使用buffer.byteLength 属性来进行初次长度限制
    // let slength = plength;
    // if (byteStride) {
    //   slength += (byteStride * (count - 1)) / accessorMacro.getTypeByte(componentType);
    //   warn('Has bufferView exist byteStride');
    // }
    const sourceTypeArr = new TA(
      buffer,
      offset,
      // slength,
    );
    const copyTypeArr = new TA(plength);
    const typeNums = accessorMacro[type];
    const stride = byteStride || typeNums;
    for (let i = 0; i < count; i += 1) {
      for (let j = 0; j < typeNums; j += 1) {
        copyTypeArr[i * typeNums + j] = sourceTypeArr[i * stride + j];
      }
    }
    // 对于 sparse 的处理
    if (sparse) {
      warn('Current not support accessor.sparse');
      // indices: 索引buffer   indices: 值buffer
      const { indices, values } = sparse;
      const indicesBuffer = extractTypeArray(
        {
          ...indices,
          count: sparse.count,
        },
        totalInfos,
        ext,
        false,
      );
      // values没有componentType需要补充
      const valuesBuffer = extractTypeArray(
        {
          ...values,
          componentType,
          count: sparse.count,
          type,
        },
        totalInfos,
        ext,
        false,
      );
      // 替换值 indicesBuffer.length 应该等于 sparse.count
      for (let i = 0; i < sparse.count; i += 1) {
        const index = indicesBuffer[i];
        for (let j = 0; j < typeNums; j += 1) {
          copyTypeArr[index * typeNums + j] = valuesBuffer[i * typeNums + j];
        }
      }
    }
    return copyTypeArr;
  }
  // 不知道在indices或values的情况下，bufferView是否会有byteStride属性，这里先默认没有
  const sourceTypeArr = new TA(
    buffer,
    offset,
    plength,
  );
  return sourceTypeArr;
}

/**
 * 处理Accessor转为OpenGL绑定需要的buffer以及相关参数
 * 这里对GPU的内存不太友好，虽然共享了buffer但是在使用
 * bufferData拷贝数据到GPU时，如果2个Accessor公用一个bufferView，
 * 那么会导致bindBuffer绑定同样的数据2次，浪费内存。
 * 上面这种情况非常复杂，涉及到多个Primitive共享buffer，以后考虑优化
 */
function parseAccessorToGl(accessor, totalInfos, ext) {
  const { bufferViews } = totalInfos;
  const bufferView = bufferViews[accessor.bufferView];
  const { target } = bufferView;
  const {
    type,
    componentType,
    normalized,
  } = accessor;
  // 提取后会紧凑数组
  const typeArray = extractTypeArray(accessor, totalInfos, ext);
  // target和normalized在GLTF文件中好像并没有给出（测试文件中没有看到）。
  return {
    typeArray,
    stride: accessorMacro[type] * accessorMacro.getTypeByte(componentType),
    target: bufferMacro[target],
    size: accessorMacro[type],
    normalized,
    type: accessorMacro.getRawType(componentType),
  };
}

function generatePrimitive(pri, totalInfos, ext) {
  const {
    attributes,
    indices,
    // material,
    // mode,
  } = pri;
  const { accessors } = totalInfos;
  const primitive = {};
  Object.entries(attributes).forEach(([name, value]) => {
    if (name === 'JOINTS_0') {
      // 一个顶点最多被4个joints影响，所以这里是vec4
      const joints4 = accessors[value];
      // 由于类型已知，所以这里直接读取typeArray就可以了。
      primitive[name.toLowerCase()] = extractTypeArray(joints4, totalInfos, ext);
    } else if (name === 'WEIGHTS_0') {
      // 同JOINTS_0
      const wegihts4 = accessors[value];
      primitive[name.toLowerCase()] = extractTypeArray(wegihts4, totalInfos, ext);
    } else {
      primitive[name.toLowerCase()] = parseAccessorToGl(accessors[value], totalInfos, ext);
    }
  });
  primitive.indices = parseAccessorToGl(accessors[indices], totalInfos, ext);
  return primitive;
}

function parseMesh(meshInfos, totalInfos, ext) {
  const { primitives, skin } = meshInfos;
  let mesh;
  if (Number.isInteger(skin)) {
    mesh = new SkinMesh();
    mesh.skin = ext.skins[skin];
  } else {
    mesh = new Mesh();
  }

  primitives.forEach((pri) => {
    const primitive = generatePrimitive(pri, totalInfos, ext);
    mesh.addPrimitive(primitive);
  });

  return mesh;
}

function parseGameObject(nodeInfos, totalInfos, ext) {
  const gameObj = new GameObject(nodeInfos);
  const { nodes, meshes } = totalInfos;
  const { mesh, children, skin } = nodeInfos;

  if (mesh) {
    if (Number.isInteger(skin)) {
      gameObj.mesh = parseMesh({ ...(meshes[mesh]), skin }, totalInfos, ext);
    } else {
      gameObj.mesh = parseMesh(meshes[mesh], totalInfos, ext);
    }
  }

  if (children && children.length > 0) {
    children.forEach((node) => {
      gameObj.addChild(parseGameObject(nodes[node], totalInfos, ext));
    });
  }

  return gameObj;
}

function parseJoint(jointId, totalInfos, ext) {
  const { nodes } = totalInfos;
  const { nodeId2Joint } = ext;
  let joint;
  // nodeId2Joint 只有在parseJoints处理的时候才会传入
  if (nodeId2Joint) {
    joint = nodeId2Joint.get(jointId);
    if (!joint) {
      warn(`cannot find jointId:${jointId} in skin.joints`);
    }
  } else {
    joint = new Joint(nodes[jointId]);
    joint.children = joint.children
      .map((id) => parseJoint(id, totalInfos, ext));
  }
  return joint;
}

function parseJoints(joints, totalInfos) {
  const nodeId2Joint = new Map();
  const { nodes } = totalInfos;
  const result = joints.map((jointId) => {
    const joint = nodes[jointId];
    const newJoint = new Joint(joint);
    nodeId2Joint.set(jointId, newJoint);
    return newJoint;
  });
  // handler children
  result.forEach((joint) => {
    if (joint.children) {
      // eslint-disable-next-line
      joint.children = joint.children
        .filter((jointId) => nodeId2Joint.get(jointId))
        .map((jointId) => parseJoint(jointId, totalInfos, { nodeId2Joint }));
    }
  });

  return result;
}

function parseSkins(skins, totalInfos, ext) {
  return skins.map((skin) => {
    const {
      skeleton,
      joints,
      inverseBindMatrices,
      name,
    } = skin;
    const result = { name };
    // 这里必须先处理skin.joints列表然后再处理joint.children
    result.joints = parseJoints(joints, totalInfos, ext);

    // 这里可能还是需要额外的信息去读取
    result.inverseBindMatrices = parseAccessorToGl(
      totalInfos.accessors[inverseBindMatrices],
      totalInfos,
      ext,
    );
    // root node
    if (skeleton) {
      result.skeleton = parseJoint(skeleton, totalInfos, ext);
    }

    return result;
  });
}

export default class GLTFLoader extends Loader {
  constructor(...args) {
    super(...args);
    this.minVersion = '2.0';
    this.maxVersion = '2.0';

    this.$objectURL = '';
  }

  static get version() { return '0.0.1'; }

  static async load(src) {
    const file = await GLTFLoader.loadFile(src);
    const text = await file.text();
    /**
     * 这里会丢失精度：
     * JavaScript client implementations should convert JSON-parsed
     * floating-point doubles to single precision, when componentType is 5126 (FLOAT).
     * This could be done with Math.fround function.
     */
    const infos = JSON.parse(text);
    console.log(infos);
    const scene = await GLTFLoader.parse(infos);
    GLTFLoader.validator(infos.asset);
    return scene;
  }

  static async loadFile(src) {
    const response = await fetch(src, {});
    const file = await response.blob();
    // this.objectURL = URL.createObjectURL(file);
    return file;
  }

  static async loadBuffers(buffers) {
    const loadedBuffers = [];
    const loadingBuffers = [];
    const regBase64 = /^data:\S+;base64,/;
    buffers.forEach((buffer, index) => {
      if (regBase64.test(buffer.uri)) {
        // 这里没有检查base64的合法性
        const raw = window.atob(buffer.uri.replace(regBase64, ''));
        const outputArray = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i += 1) {
          outputArray[i] = raw.charCodeAt(i);
        }
        loadedBuffers[index] = {
          byteLength: buffer.byteLength,
          buffer: outputArray.buffer,
        };
      } else {
        loadingBuffers.push(GLTFLoader.loadFile(buffer.uri).then(async (file) => {
          const bff = await file.arrayBuffer();
          // TODO: parse buffer file
          loadedBuffers[index] = {
            byteLength: buffer.byteLength,
            buffer: bff,
          };
        }));
      }
    });
    await Promise.all(loadingBuffers);
    return loadedBuffers;
  }

  static async parse(infos) {
    if (infos.scenes.length > 1) { warn('Only support one scene'); }
    const sceneInfos = infos.scenes[0];
    const { nodes, buffers, skins } = infos;
    const extInfo = {};

    const scene = new Scene({ name: sceneInfos.name });

    extInfo.buffers = await GLTFLoader.loadBuffers(buffers);

    extInfo.skins = skins ? parseSkins(skins, infos, extInfo) : [];

    infos.scenes[0].nodes.forEach((node) => {
      const gameObj = parseGameObject(
        nodes[node],
        infos,
        extInfo,
      );
      scene.addGameObject(gameObj);
    });

    // 手动添加一个自己的摄像机
    const cameraGameObj = new GameObject({});
    cameraGameObj.isCamera = true;
    cameraGameObj.addComponent(new Camera({ parent: cameraGameObj }));
    scene.addGameObject(cameraGameObj);

    return scene;
  }

  static validator(assets) {
    const MIN_VERSION = '2.0';
    const MAX_VERSION = '2.0';
    if (Loader.compareVersion(MIN_VERSION, assets.version) && Loader.compareVersion(MAX_VERSION, '2.0')) {
      return true;
    }
    return true;
  }
}
