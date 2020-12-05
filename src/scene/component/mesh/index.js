import Component from '../index';

/**
 * 注意这里和position的buffer结构相关，这里认为是紧凑的
 * @param {TypeArray} position
 */
function readPositionToPointArr(indices, position) {
  const POINT_COUNT = 3;
  const result = [];
  indices.typeArray.forEach((item, index) => {
    const num = index % POINT_COUNT;
    if (num === 0) { result.push([]); }
    const point = result[result.length - 1];
    point[num] = position.typeArray[item];
  });
  return result;
}

export default class Mesh extends Component {
  constructor(...args) {
    super(...args);
    // TODO: material
    // 网格可能会被分割，所以实际网格是一个数组
    this.primitives = [];
    this.$memCache = [];
    this.tag = 'Mesh';
  }

  addPrimitive(infos) {
    this.primitives.push(infos);
  }

  /**
   * 获取最大最小的x,y,z坐标,注意这里是处于loacl坐标系下。
   */
  getAxiasArea() {
    // max-xyz, min-xyz
    const MAX = [0, 0, 0];
    const MIN = [0, 0, 0];
    this.primitives.forEach((primitive) => {
      const { indices, position } = primitive;
      const points = readPositionToPointArr(indices, position);
      points.forEach((point) => {
        point.forEach((coord, index) => {
          if (coord > MAX[index]) { MAX[index] = coord; }
          if (coord < MIN[index]) { MIN[index] = coord; }
        });
      });
    });
    return [MAX, MIN];
  }

  /**
   * 获取包围盒，注意这里是处于loacl坐标系下。
   */
  // getBoundingBox() {}
}
