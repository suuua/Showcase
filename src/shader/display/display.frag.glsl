#version 300 es

precision mediump float;
precision mediump sampler2DShadow;

in vec2 TexCoords;

uniform sampler2D playTexture;

out vec4 FragColor;

void main()
{
  FragColor = vec4(texture(playTexture, TexCoords).rgb, 1.0);
  // FragColor = vec4(vec3(texture(playTexture, vec3(TexCoords.xy, 0.99999))), 1.0);
}
