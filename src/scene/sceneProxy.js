/**
 * webgl中 每个canvas的webgl上下文并不是通用的，因此创建/缓存的数据需要在gl上下文的维度下进行
 * 注意，不同的gl上下文 数据不能共用
 * TODO：
 * 当支持动画时，由于顶点数据会变化，这里还需要能够检测这种顶点数据的变化并更新/销毁缓存的顶点数组对象
 */
export default function createSceneProxy(scene) {
  const storage = new Map();
  const handler = {
    get(target, propKey, receiver) {
      if (propKey === 'getRenderPrimitives') {
        return function proxyCall(...args) {
          const cache = storage.get(propKey);
          if (cache) { return cache; }
          const prop = Reflect.get(target, propKey, receiver);
          const result = prop.apply(target, args);
          storage.set(propKey, result);
          return result;
        };
      }
      // 默认情况下直接返回
      return Reflect.get(target, propKey, receiver);
    },
  };
  return new Proxy(scene, handler);
}
