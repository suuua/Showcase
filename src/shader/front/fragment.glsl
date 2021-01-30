#version 300 es

#ifdef GL_ES
  precision mediump float;
#endif

#pragma debug(on)

in vec3 Normal;
in vec3 FragPos;
in vec2 TexCoord;

out vec4 FragColor;

uniform vec3 lightColor;
uniform vec3 lightPos;
uniform vec3 viewPos;
uniform sampler2D baseColorTex;
uniform sampler2D texture2;
uniform vec4 baseColorFactor;

// https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_lights_punctual/README.md
struct DirLight  {
  vec3 direction;
  vec3 color;
  // lm/m^2
  float intensity;
};

uniform DirLight dirLight;

#define POINT_LIGHT_MAX_COUNT 10
struct PointLight {
  vec3 position;
  vec3 color;
  // lm/sr
  float intensity;
  float range;
};
uniform PointLight pointLights[POINT_LIGHT_MAX_COUNT];

#define SPOT_LIGHT_MAX_COUNT 10
struct SpotLight {
  vec3 position;
  vec3 direction;
  vec3 color;
  // lm/sr
  float intensity;
  float range;
  float innerConeAngle;
  float outerConeAngle;
};
uniform SpotLight spotLights[SPOT_LIGHT_MAX_COUNT];

/*
 * TODO：改为PBR光照
 */
float calcBaseLightStrength(vec3 lightDir, vec3 normal, vec3 viewDir) {
  vec3 halfwayDir = normalize(lightDir + viewDir);
  float diff = max(dot(normal, lightDir), 0.0);
  vec3 reflectDir = reflect(-lightDir, normal);
  // float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
  // Blinn-Phong shader model
  float spec = pow(max(dot(normal, halfwayDir), 0.0), 32.0);
  // ambient diffuse spec
  return 0.05 + (diff + spec) * 0.95;
}

/*
 * TODO：材质这一块目前还没实现
 */
vec3 calcDirLight(DirLight light, vec3 normal, vec3 viewDir)
{
  if (light.color == vec3(0.0)) { return vec3(0.0); }
  vec3 lightDir = normalize(-light.direction);
  float lightStrength = calcBaseLightStrength(lightDir, normal, viewDir);

  return light.intensity * lightStrength * light.color;
}

vec3 calcPointLight(PointLight light, vec3 normal, vec3 fragPos, vec3 viewDir) {
  if (light.color == vec3(0.0)) { return vec3(0.0); }
  vec3 lightDir = normalize(light.position - fragPos);

  float lightStrength = calcBaseLightStrength(lightDir, normal, viewDir);

  float dis = distance(light.position, fragPos);
  // 超过此范围不再提供照明，并且衰减与range相关，是否需要gamma矫正？
  float attenuation = 1.0;
  if (light.range > 0.0) {
    if (dis > light.range) {
      attenuation = 0.0;
    } else {
      attenuation = max(min(1.0 - pow(dis / light.range, 4.0), 1.0), 0.0) / pow(dis, 2.0);
    }
  } else {
    // OpenGL提供的衰减函数
    // attenuation =  1.0 / (1.0 + 0.09 * dis +  0.032 * (dis * dis));
    // 根据GLTF文档衰减公式，当range为无限时的衰减
    attenuation = max(min(1.0 / pow(dis, 2.0), 1.0), 0.0);
  }

  return light.intensity * lightStrength * attenuation * light.color;
}

vec3 calcSpotLight(SpotLight light, vec3 normal, vec3 fragPos, vec3 viewDir) {
  if (light.color == vec3(0.0)) { return vec3(0.0); }
  vec3 lightDir = normalize(light.position - fragPos);
  // 角度的衰减 注意角度越大cosx越小 
  float theta = dot(lightDir, normalize(-light.direction));
  if (theta < light.outerConeAngle) { return vec3(0.0); }
  float attenuation = 1.0;
  if (theta < light.innerConeAngle ) {
    attenuation = clamp((theta - light.outerConeAngle) / (light.innerConeAngle - light.outerConeAngle), 0.0, 1.0);
  }
  // 除此外还有距离的衰减
  float dis = distance(light.position, fragPos);
  if (light.range > 0.0) {
    if (dis > light.range) {
      attenuation = 0.0;
    } else {
      attenuation *= max(min(1.0 - pow(dis / light.range, 4.0), 1.0), 0.0) / pow(dis, 2.0);
    }
  } else {
    // 根据GLTF文档衰减公式，当range为无限时的衰减
    attenuation *= max(min(1.0 / pow(dis, 2.0), 1.0), 0.0);
  }

  
  float lightStrength = calcBaseLightStrength(lightDir, normal, viewDir);

  return light.intensity * lightStrength * attenuation * light.color;
}

void main()
{

  vec3 viewDir = normalize(viewPos - FragPos);
  vec3 normal = normalize(Normal);
  vec4 objectColor = texture(baseColorTex, TexCoord) * baseColorFactor;

  vec3 lightColor = calcDirLight(dirLight, normal, viewDir);
  vec3 pointLightColor = vec3(0.0);
  for (int i = 0; i < pointLights.length(); i++) {
    pointLightColor += calcPointLight(pointLights[i], normal, FragPos, viewDir);
  }
  vec3 spotLigColor = vec3(0.0);
  for (int i = 0; i < spotLights.length(); i++) {
    spotLigColor += calcSpotLight(spotLights[i], normal, FragPos, viewDir);
  }
  FragColor = vec4(lightColor + pointLightColor + spotLigColor, 1.0) * objectColor;
}
