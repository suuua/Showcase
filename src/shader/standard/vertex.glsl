#version 300 es
layout (location = 0) in vec3 aPos;
layout (location = 1) in vec3 aNormal;

uniform mat4 model;
uniform mat4 view;
uniform mat4 perspective;

out vec3 Normal;

void main() 
{
  gl_Position = perspective * view * model * vec4(aPos.x, aPos.y, aPos.z, 1.0);
  Normal = aNormal;
}