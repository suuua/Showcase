#version 300 es

precision highp float;

in vec2 TexCoords;
uniform sampler2D gPosition;
uniform sampler2D gNormal;
uniform sampler2D gAlbedoOcclusion;
uniform sampler2D gDepthMetallicRoughness;
uniform sampler2D shadowMap;
uniform sampler2D preLoTexture;

// https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_lights_punctual/README.md
struct Light {
  uint type;
  vec3 position;
  vec3 direction;
  vec3 color;
  float intensity;
  float range;
  float innerConeAngle;
  float outerConeAngle;
};

uniform Light light;

uniform vec3 viewPos;

layout (location = 0) out vec4 FragColor;


const float PI = 3.14159265359;

vec3 calcDirLight(Light light)
{
  if (light.color == vec3(0.0)) { return vec3(0.0); }
  return light.intensity * light.color;
}

vec3 calcPointLight(Light light, vec3 fragPos) {
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

vec3 calcSpotLight(Light light, vec3 fragPos) {
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
  float shadow = texture(shadowMap, TexCoords).r;

  if (shadow >= 1.0) {
    FragColor = texture(preLoTexture, TexCoords);
    return;
  }

  vec3 F0 = vec3(0.04); 
  F0 = mix(F0, albedo, metallic);

  // reflectance equation
  vec3 Lo = vec3(0.0);
  
  // calculate per-light radiance
  vec3 L, radiance;
  if (light.type == 1u) {
    L = -light.direction;
    radiance = calcDirLight(light);
  } else if (light.type == 2u) {
    L = normalize(light.position - fragPos);
    radiance = calcSpotLight(light, fragPos);
  } else {
    L = normalize(light.position - fragPos);
    radiance = calcPointLight(light, fragPos);
  }     
  vec3 H = normalize(V + L);

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

  Lo += (kD * albedo / PI + specular) * radiance * NdotL * (1.0 - shadow);
  Lo += texture(preLoTexture, TexCoords).rgb;

  FragColor = vec4(Lo, 1.0);
}  


