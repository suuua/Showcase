#version 300 es

precision highp float;
precision highp sampler2DShadow;
precision highp sampler2D;

struct LightBase {
  vec3 direction;
  vec3 position;
  float intensity;
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

float F1 = 1.0;

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
  // 阴影增益因子
  float inten = 1.0;
  if (lightType == uint(1)) {
    bias = max(0.005 * (F1 - dot(normal, -light.direction)), 0.0005);
  } else {
    vec3 lightDir = normalize(light.position - fragPos);
    float dis = distance(light.position, fragPos);
    inten = 1.0 / (dis * dis);
    bias = max(0.0001 * (F1 - dot(normal, lightDir)), 0.00001);
  }
  vec3 texCamerCoord = calcTexCoord(cameraSpacePos);
  vec4 preShadowDepth = texture(preShadowDepthMap, texCamerCoord.xy);
  vec3 texLightCoord = calcTexCoord(lightSpacePos);
  float depth = texture(depthMap, vec3(texLightCoord.xy, texLightCoord.z - bias));
  
  // 这里计算RGB每个通道的遮挡强度，由于光源具有颜色，因此遮挡的阴影可能有不同的颜色。
  // 如果给光源编号并用8位来表示哪个光源被遮挡，那么只能支持8个光源并在光照过程中实现PCF过程。
  // 因此，这里保存被遮挡的颜色值。所以此处计算出的遮挡值应该和光照渲染的照亮值一样。
  shadowDepth = vec4(vec3(preShadowDepth.r + depth * 0.3 * inten * light.intensity), F1);
  // FragColor = vec4(vec3(preShadowCount.r + depth), F1);
}
