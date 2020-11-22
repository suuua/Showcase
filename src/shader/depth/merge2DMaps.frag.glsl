#version 300 es

precision highp float;
precision highp sampler2DShadow;
precision highp sampler2D;

struct LightBase {
  vec3 direction;
  vec3 position;
};

uniform uint lightType;
uniform sampler2D preShadowDepthMap;
uniform sampler2DShadow depthMap;
uniform LightBase light;

in vec3 normal;
in vec4 lightSpacePos;
in vec4 cameraSpacePos;
in vec3 fragPos;

layout (location = 0) out vec4 shadowDepth;

// out vec4 FragColor;

vec3 calcTexCoord(vec4 spacePos)
{
  // 执行透视除法
  vec3 projCoords = spacePos.xyz / spacePos.w;
  // 变换到[0,1]的范围
  projCoords = projCoords * 0.5 + 0.5;
  return projCoords;
}

void main()
{
  // 用于改善阴影失真
  float bias = 0.0;
  if (lightType == uint(1)) {
    bias = max(0.005 * (1.0 - dot(normal, -light.direction)), 0.0005);
  } else {
    vec3 lightDir = normalize(light.position - fragPos);
    bias = max(0.0001 * (1.0 - dot(normal, lightDir)), 0.00001);
  }
  vec3 texCamerCoord = calcTexCoord(cameraSpacePos);
  vec4 preShadowDepth = texture(preShadowDepthMap, texCamerCoord.xy);
  vec3 texLightCoord = calcTexCoord(lightSpacePos);
  float depth = texture(depthMap, vec3(texLightCoord.xy, texLightCoord.z - bias));

  shadowDepth = vec4(vec3(preShadowDepth.r + depth * 0.3), 1.0);
  // FragColor = vec4(vec3(preShadowCount.r + depth), 1.0);
}
