/**
 * Init texture
 * @param {WebGLRenderingContext} gl
 * @param {pixels} textureSource see https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
 */
export default function initTexture(gl, textureSource) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  if (textureSource) {
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGB,
      textureSource.width,
      textureSource.height,
      0,
      gl.RGB,
      gl.UNSIGNED_BYTE, textureSource,
    );
    // TODO
    // gl.generateMipmap(gl.TEXTURE_2D);
  }
  // set texture wrapping to GL_REPEAT (default wrapping method)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  // set texture filtering parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  return texture;
}
