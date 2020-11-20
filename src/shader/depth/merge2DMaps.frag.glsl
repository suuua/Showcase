#version 300 es

precision mediump float;
precision mediump sampler2DShadow;
precision mediump sampler2D;
precision lowp usampler2D;

struct LightBase {
  vec3 direction;
};

uniform sampler2D preShadowDepthMap;
uniform sampler2DShadow depthMap;
uniform LightBase light;

in vec3 normal;
in vec4 lightSpacePos;
in vec4 cameraSpacePos;

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
  float bias = max(0.005 * (1.0 - dot(normal, light.direction)), 0.0005);
  vec3 texCamerCoord = calcTexCoord(cameraSpacePos);
  vec4 preShadowDepth = texture(preShadowDepthMap, texCamerCoord.xy);
  vec3 texLightCoord = calcTexCoord(lightSpacePos);
  float depth = texture(depthMap, vec3(texLightCoord.xy, texLightCoord.z - bias));

  shadowDepth = vec4(vec3(preShadowDepth.r + depth * 0.3), 1.0);
  // FragColor = vec4(vec3(preShadowCount.r + depth), 1.0);
}
