#version 300 es

precision highp float;
precision highp sampler2DShadow;
precision highp sampler2D;

struct LightBase {
  uint type;
  vec3 direction;
  vec3 position;
};

uniform sampler2DShadow depthMap;
uniform LightBase light;

in vec3 normal;
in vec4 lightSpacePos;
in vec3 fragPos;

layout (location = 0) out vec4 shadow;

const float PF0 = 0.0;
const float PF1 = 1.0;

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
  float bias = PF0;
  if (light.type == 1u) {
    bias = max(0.001 * (PF1 - dot(normal, -light.direction)), 0.0001);
  } else {
    vec3 lightDir = normalize(light.position - fragPos);
    bias = max(0.0001 * (PF1 - dot(normal, lightDir)), 0.00001);
  }

  // CLAMP_TO_EDGE， repeat等可能会导致错误的阴影而webgl好像不支持CLAMP_TO_BORDER
  // 这里还需要要限定如果采样的坐标超过纹理的大小时如何处理
  vec3 texLightCoord = calcTexCoord(lightSpacePos);
  // PCF
  vec2 shadowSize = PF1 / vec2(textureSize(depthMap, 0));
  float depth = PF0;
  for (int x = -1; x <= 1; x++) {
    for (int y = -1; y <= 1; y++) {
      vec2 offset = vec2(float(x) * shadowSize.x, float(y) * shadowSize.y);
      vec2 offsetTexLightCoord = texLightCoord.xy + offset;
      // 模拟的一个CLAMP_TO_BORDER
      if (
        offsetTexLightCoord.x > PF0 && offsetTexLightCoord.x < PF1 &&
        offsetTexLightCoord.y > PF0 && offsetTexLightCoord.y < PF1
      ) {
        depth += texture(depthMap, vec3(offsetTexLightCoord, texLightCoord.z - bias));
      }
    }
  }
  depth /= 9.0;
  
  shadow = vec4(depth);
}
