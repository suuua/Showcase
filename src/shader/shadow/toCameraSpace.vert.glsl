#version 300 es

#pragma debug(on)

layout (location = 0) in vec3 position;
layout (location = 1) in vec3 aNormal;

uniform mat4 model;
uniform mat4 cameraSpaceMatrix;
uniform mat4 lightSpaceMatrix;

out vec4 lightSpacePos;
out vec4 cameraSpacePos;
out vec3 normal;
out vec3 fragPos;

void main()
{
  vec4 wordPos = model * vec4(position, 1.0);
  lightSpacePos = lightSpaceMatrix * wordPos;
  normal = mat3(transpose(inverse(model))) * aNormal;
  fragPos = vec3(wordPos);
  gl_Position = cameraSpaceMatrix * wordPos;
}