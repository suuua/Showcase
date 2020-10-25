export function arr2vec(arr, count = 2) {
  let length = count;
  if (length > 4) { length = 4; } else if (length < 2) { length = 2; }
  const typeArr = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    typeArr[i] = arr[i] || 0;
  }
  return typeArr;
}

export function arr2ivec(arr, count = 2) {
  let length = count;
  if (length > 4) { length = 4; } else if (length < 2) { length = 2; }
  const typeArr = Int32Array(length);
  for (let i = 0; i < length; i += 1) {
    typeArr[i] = parseInt(arr[i], 10) || 0;
  }
  return typeArr;
}

/**
 * 在gl-Matrix没有发现四元数转欧拉角的方法，这里自己先实现一个
 * https://www.cnblogs.com/wqj1212/archive/2010/11/21/1883033.html
 * @param {Quat} quat 顺序 xyzw
 */
export function quatToEuler(quat) {
  const roll = Math.atan2(
    2 * (quat[3] * quat[2] + quat[0] * quat[1]),
    1 - 2 * (quat[2] ** 2 + quat[0] ** 2),
  );
  const pitch = Math.asin(2 * (quat[3] * quat[0] - quat[1] * quat[2]));
  const yaw = Math.atan2(
    2 * (quat[3] * quat[1] + quat[2] * quat[0]),
    1 - 2 * (quat[0] ** 2 + quat[1] ** 2),
  );

  return [pitch, yaw, roll];
}

export function radianToAngle(radian) {
  return (radian / Math.PI) * 180;
}

export function isEqualArray(arr1, arr2) {
  if (!arr1 || !arr2 || arr1.length !== arr2.length) { return false; }
  for (let i = 0; i < arr1.length; i += 1) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }
  return true;
}
