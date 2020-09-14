/**
 * 绘制函数应该根据shader的不同需要去自动生成的，这里先使用一个来进行测试
 */
export default function draw(gl, scene, shaders) {
  // 这里绘制多物体时还需要更改
  const VAO = gl.createVertexArray();
  gl.bindVertexArray(VAO);
  scene.gameObjects.forEach((item) => {
    // TODO: multiple shader
    const shader = shaders[0];
    shader.setGpuData(item);
  });

  window.requestAnimationFrame(() => {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindVertexArray(VAO);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, 0);
  });
}
