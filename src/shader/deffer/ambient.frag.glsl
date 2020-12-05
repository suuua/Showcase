#version 300 es

precision mediump float;

in vec2 TexCoords;

uniform sampler2D gAlbedoOcclusion;
uniform sampler2D loTexture;

out vec4 fragColor;

void main()
{
  vec4 albedoOcclusion = texture(gAlbedoOcclusion, TexCoords);
  vec3 albedo = albedoOcclusion.rgb;
  vec3 Lo = texture(loTexture, TexCoords).rgb;
  float ao = albedoOcclusion.a;
  vec3 ambient = vec3(0.03) * albedo * ao;
  vec3 color = ambient + Lo;

  color = color / (color + vec3(1.0));
  color = pow(color, vec3(1.0/2.2));  

  fragColor = vec4(color, 1.0);
}
