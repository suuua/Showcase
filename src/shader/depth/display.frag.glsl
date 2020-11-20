#version 300 es

precision highp float;
precision highp sampler2DShadow;
precision highp sampler2D;

in vec2 TexCoords;

uniform sampler2D depthMap;

out vec4 FragColor;

void main()
{
  // float depth = texture(depthMap, vec3(TexCoords, 0.5));
  // FragColor = vec4(vec3(depth), 1.0);
  FragColor = vec4(texture(depthMap, TexCoords).rgb, 1.0);
}
