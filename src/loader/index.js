import Texture from '../texture';
import Material from '../material';
import GameObject from '../gameObject';
import Scene from '../scene';

export function loadUrl(url) {
  const img = document.createElement('img');
  img.src = url;
  img.width = 1;
  img.height = 1;
  document.body.appendChild(img);
  return new Promise((res, rej) => {
    img.addEventListener('load', () => res(img));
    img.addEventListener('error', (err) => rej(err));
  });
}

export async function loadModel(source) {
  const img = await loadUrl(source);
  const scene = new Scene();
  const texture = new Texture({
    data: img,
    height: img.naturalHeight,
    width: img.naturalWidth,
  });
  // TODO: 这里 GameObject 需要指定 shader, 但是如果直接在这里指定的话会导致耦合严重，考虑使用shaderName来指定shader并延迟创建
  scene.addGameObject(new GameObject({
    material: new Material({ textures: [texture] }),
  }));
  return scene;
}

export async function loadShader() {
  return 1;
}

export default class Loader {
  constructor() {
    // 缓存文件
    this.fileCache = null;
  }

  static compareVersion(v1, v2) {
    if (v1 > v2) {
      return 1;
    }
    if (v1 < v2) {
      return -1;
    }
    return 0;
  }
}
