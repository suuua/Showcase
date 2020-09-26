#version 300 es

#ifdef GL_ES
  precision mediump float;
#endif

in vec3 Normal;
out vec4 FragColor;

uniform vec3 lightColor;

void main()
{
  FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}