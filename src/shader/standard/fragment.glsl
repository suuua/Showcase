#version 300 es

#ifdef GL_ES
  precision mediump float;
#endif

in vec3 ourColor;
in vec2 TexCoord;
uniform sampler2D ourTexture;

out vec4 FragColor;

void main()
{
  FragColor = texture(ourTexture, TexCoord) * vec4(ourColor, 1.0);
  // FragColor = vec4(0.5, 0.5, 0.5, 1);
}