#version 300 es

precision mediump float;


out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D gPosition;
uniform sampler2D gNormal;
uniform sampler2D gAlbedoOcclusion;
uniform sampler2D gDepthMetallicRoughness;

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

/////////////////////////////  ping-pong light model start ///////////////////////////////

// /*
//  * 计算入射角度对光强度的影响，当使用 ping-pong模型时使用
//  */
// float calcBaseLightStrength(vec3 lightDir, vec3 normal, vec3 viewDir) {
//   vec3 halfwayDir = normalize(lightDir + viewDir);
//   float diff = max(dot(normal, lightDir), 0.0);
//   vec3 reflectDir = reflect(-lightDir, normal);
//   // float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
//   // Blinn-Phong shader model
//   float spec = pow(max(dot(normal, halfwayDir), 0.0), 32.0);
//   // ambient diffuse spec
//   return 0.2 + (diff + spec) * 0.8;
// }

// vec3 calcDirLight(DirLight light, vec3 normal, vec3 viewDir)
// {
//   if (light.color == vec3(0.0)) { return vec3(0.0); }
//   vec3 lightDir = normalize(-light.direction);
//   float lightStrength = calcBaseLightStrength(lightDir, normal, viewDir);

//   return light.intensity * lightStrength * light.color;
// }

// vec3 calcPointLight(PointLight light, vec3 normal, vec3 fragPos, vec3 viewDir) {
//   if (light.color == vec3(0.0)) { return vec3(0.0); }
//   vec3 lightDir = normalize(light.position - fragPos);

//   float lightStrength = calcBaseLightStrength(lightDir, normal, viewDir);

//   float dis = distance(light.position, fragPos);
//   // 超过此范围不再提供照明，并且衰减与range相关，是否需要gamma矫正？
//   float attenuation = 1.0;
//   if (light.range > 0.0) {
//     if (dis > light.range) {
//       attenuation = 0.0;
//     } else {
//       attenuation = max(min(1.0 - pow(dis / light.range, 4.0), 1.0), 0.0) / pow(dis, 2.0);
//     }
//   } else {
//     // OpenGL提供的衰减函数
//     // attenuation =  1.0 / (1.0 + 0.09 * dis +  0.032 * (dis * dis));
//     // 根据GLTF文档衰减公式，当range为无限时的衰减
//     attenuation = max(min(1.0 / pow(dis, 2.0), 1.0), 0.0);
//   }

//   return light.intensity * lightStrength * attenuation * light.color;
// }

// vec3 calcSpotLight(SpotLight light, vec3 normal, vec3 fragPos, vec3 viewDir) {
//   if (light.color == vec3(0.0)) { return vec3(0.0); }
//   vec3 lightDir = normalize(light.position - fragPos);
//   // 角度的衰减 注意角度越大cosx越小 
//   float theta = dot(lightDir, normalize(-light.direction));
//   if (theta < light.outerConeAngle) { return vec3(0.0); }
//   float attenuation = 1.0;
//   if (theta < light.innerConeAngle ) {
//     attenuation = clamp((theta - light.outerConeAngle) / (light.innerConeAngle - light.outerConeAngle), 0.0, 1.0);
//   }
//   // 除此外还有距离的衰减
//   float dis = distance(light.position, fragPos);
//   if (light.range > 0.0) {
//     if (dis > light.range) {
//       attenuation = 0.0;
//     } else {
//       attenuation *= max(min(1.0 - pow(dis / light.range, 4.0), 1.0), 0.0) / pow(dis, 2.0);
//     }
//   } else {
//     // 根据GLTF文档衰减公式，当range为无限时的衰减
//     attenuation *= max(min(1.0 / pow(dis, 2.0), 1.0), 0.0);
//   }

  
//   float lightStrength = calcBaseLightStrength(lightDir, normal, viewDir);

//   return light.intensity * lightStrength * attenuation * light.color;
// }

// void main()
// {             
//   // 从G缓冲中获取数据
//   vec3 FragPos = texture(gPosition, TexCoords).rgb;
//   vec3 Normal = texture(gNormal, TexCoords).rgb;
//   vec3 Albedo = texture(gAlbedoSpec, TexCoords).rgb;
//   float Specular = texture(gAlbedoSpec, TexCoords).a;


//   vec3 viewDir = normalize(viewPos - FragPos);
//   vec3 normal = normalize(Normal);

//   vec3 lightColor = calcDirLight(dirLight, normal, viewDir);
//   vec3 pointLightColor = vec3(0.0);
//   // 遮挡导致的阴影系数
//   float shadow = 1.0 - texture(shadowMap, TexCoords).r;
//   for (int i = 0; i < pointLights.length(); i++) {
//     pointLightColor += calcPointLight(pointLights[i], normal, FragPos, viewDir);
//   }
//   vec3 spotLigColor = vec3(0.0);
//   for (int i = 0; i < spotLights.length(); i++) {
//     spotLigColor += calcSpotLight(spotLights[i], normal, FragPos, viewDir);
//   }
//   FragColor = vec4((lightColor + pointLightColor + spotLigColor) * shadow, 1.0) * vec4(Albedo, 1.0);
//   // FragColor = vec4(Albedo, 1.0);
// }

///////////////////////////// ping-pong light model end ///////////////////////////////


///////////////////////////// PBR light model start ////////////////////////////////////

const float PI = 3.14159265359;

vec3 calcDirLight(DirLight light)
{
  if (light.color == vec3(0.0)) { return vec3(0.0); }
  return light.intensity * light.color;
}

vec3 calcPointLight(PointLight light, vec3 fragPos) {
  if (light.color == vec3(0.0)) { return vec3(0.0); }

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

  return light.intensity * attenuation * light.color;
}

vec3 calcSpotLight(SpotLight light, vec3 fragPos) {
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

  return light.intensity * attenuation * light.color;
}

float DistributionGGX(vec3 N, vec3 H, float roughness)
{
    float a      = roughness*roughness;
    float a2     = a*a;
    float NdotH  = max(dot(N, H), 0.0);
    float NdotH2 = NdotH*NdotH;

    float nom   = a2;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;

    return nom / denom;
}

float GeometrySchlickGGX(float NdotV, float roughness)
{
    float r = (roughness + 1.0);
    float k = (r*r) / 8.0;

    float nom   = NdotV;
    float denom = NdotV * (1.0 - k) + k;

    return nom / denom;
}
float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness)
{
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2  = GeometrySchlickGGX(NdotV, roughness);
    float ggx1  = GeometrySchlickGGX(NdotL, roughness);

    return ggx1 * ggx2;
}

vec3 fresnelSchlick(float cosTheta, vec3 F0)
{
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}  

void main()
{
  vec3 fragPos = texture(gPosition, TexCoords).rgb;
  vec4 albedoOcclusion = texture(gAlbedoOcclusion, TexCoords);
  vec4 depthMetallicRoughness = texture(gDepthMetallicRoughness, TexCoords);
  vec3 albedo = albedoOcclusion.rgb;
  float ao = albedoOcclusion.a;
  float metallic = depthMetallicRoughness.g;
  float roughness = depthMetallicRoughness.b;
  vec3 N = texture(gNormal, TexCoords).rgb;
  vec3 V = normalize(viewPos - fragPos);
  const int pointLen = pointLights.length();
  const int spotLen = spotLights.length();

  vec3 F0 = vec3(0.04); 
  F0 = mix(F0, albedo, metallic);

  const int lightCount = pointLen + spotLen + 1;
  vec3 radianceList[lightCount];
  vec3 lightDirs[lightCount];
  // directional light
  radianceList[0] = calcDirLight(dirLight);
  lightDirs[0] = -dirLight.direction;
  // spot light
  for (int i = 0; i < spotLen; i++) {
    radianceList[1 + i] = calcSpotLight(spotLights[i], fragPos);
    lightDirs[1 + i] = normalize(spotLights[i].position - fragPos);
  }
  // point light
  for (int i = 0; i < pointLen; i++) {
    radianceList[1 + spotLen + i] = calcPointLight(pointLights[i], fragPos);
    lightDirs[1 + spotLen + i] = normalize(pointLights[i].position - fragPos);
  }

  // reflectance equation
  vec3 Lo = vec3(0.0);
  for(int i = 0; i < lightCount; i++)
  {
    // calculate per-light radiance
    vec3 L = lightDirs[i];
    vec3 H = normalize(V + L);

    // 计算光的距离衰减，这里可以用 ping-pong 模型的计算方式
    vec3 radiance = radianceList[i];        

    // cook-torrance brdf
    float NDF = DistributionGGX(N, H, roughness);        
    float G   = GeometrySmith(N, V, L, roughness);      
    vec3 F    = fresnelSchlick(max(dot(H, V), 0.0), F0);       

    vec3 kS = F;
    vec3 kD = vec3(1.0) - kS;
    kD *= 1.0 - metallic;     

    vec3 nominator    = NDF * G * F;
    float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.001; 
    vec3 specular     = nominator / denominator;

    // add to outgoing radiance Lo
    float NdotL = max(dot(N, L), 0.0);
    Lo += (kD * albedo / PI + specular) * radiance * NdotL; 
  }

  vec3 ambient = vec3(0.03) * albedo * ao;
  vec3 color = ambient + Lo;

  color = color / (color + vec3(1.0));
  color = pow(color, vec3(1.0/2.2));  

  FragColor = vec4(color, 1.0);
}  


///////////////////////////// PBR light model end //////////////////////////////////////
