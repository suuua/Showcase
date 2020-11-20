#version 300 es
// #extension EXT_color_buffer_float : require
// #extension EXT_color_buffer_half_float : require

precision mediump float;


out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D gPosition;
uniform sampler2D gNormal;
uniform sampler2D gAlbedoSpec;
uniform sampler2D gDepth;
uniform sampler2D shadowMap;

// https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_lights_punctual/README.md
struct DirLight  {
  vec3 direction;
  vec3 color;
  // lm/m^2
  float intensity;
};

uniform DirLight dirLight;

struct PointLight {
  vec3 position;
  vec3 color;
  // lm/sr
  float intensity;
  float range;
};
uniform PointLight pointLights[@POINT_LIGHT_COUNT];

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

uniform SpotLight spotLights[@SPOT_LIGHT_COUNT];

uniform vec3 viewPos;

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
  return 0.2 + (diff + spec) * 0.8;
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
  // 从G缓冲中获取数据
  vec3 FragPos = texture(gPosition, TexCoords).rgb;
  vec3 Normal = texture(gNormal, TexCoords).rgb;
  vec3 Albedo = texture(gAlbedoSpec, TexCoords).rgb;
  float Specular = texture(gAlbedoSpec, TexCoords).a;


  vec3 viewDir = normalize(viewPos - FragPos);
  vec3 normal = normalize(Normal);

  vec3 lightColor = calcDirLight(dirLight, normal, viewDir);
  vec3 pointLightColor = vec3(0.0);
  // 遮挡导致的阴影系数
  float shadow = 1.0 - texture(shadowMap, TexCoords).r;
  for (int i = 0; i < pointLights.length(); i++) {
    pointLightColor += calcPointLight(pointLights[i], normal, FragPos, viewDir);
  }
  vec3 spotLigColor = vec3(0.0);
  for (int i = 0; i < spotLights.length(); i++) {
    spotLigColor += calcSpotLight(spotLights[i], normal, FragPos, viewDir);
  }
  FragColor = vec4((lightColor + pointLightColor + spotLigColor) * shadow, 1.0) * vec4(Albedo, 1.0);
  // FragColor = vec4(Albedo, 1.0);
}