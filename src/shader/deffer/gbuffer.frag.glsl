#version 300 es

#ifdef GL_ES
  precision mediump float;
#endif

#pragma debug(on)

layout (location = 0) out vec3 gPosition;
layout (location = 1) out vec3 gNormal;
layout (location = 2) out vec4 gAlbedoOcclusion;
layout (location = 3) out vec4 gDepthMetallicRoughness;

in vec2 TexCoord;
in vec3 FragPos;
in vec3 Normal;

uniform vec4 baseColorFactor;
uniform float roughnessFactor;
uniform float metallicFactor;
uniform sampler2D baseColorTex;
uniform sampler2D metallicRoughnessTexture;
uniform sampler2D normalTexture;
uniform sampler2D occlusionTexture;

void main()
{    
    vec4 baseColor = texture(baseColorTex, TexCoord) * baseColorFactor;
    vec4 metallicRoughness = texture(metallicRoughnessTexture, TexCoord);
    vec3 normal = texture(normalTexture, TexCoord).rgb;
    float occlusion = texture(occlusionTexture, TexCoord).r;
    gPosition = FragPos;
    // 这里如何判断是否有法线贴图？ 这样不生效
    // gNormal = vec3(0.0) == normal ? normalize(Normal) : normal;
    gNormal = normalize(Normal);
    gAlbedoOcclusion.rgb = baseColor.rgb;
    gAlbedoOcclusion.a = 1.0;
    gDepthMetallicRoughness.r = gl_FragCoord.z;
    // 注意这里是反的
    gDepthMetallicRoughness.g = metallicRoughness.b * metallicFactor;
    gDepthMetallicRoughness.b = metallicRoughness.g * roughnessFactor;
}  