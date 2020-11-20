#version 300 es
// #extension EXT_color_buffer_float : require
// #extension EXT_color_buffer_half_float : require

#ifdef GL_ES
  precision mediump float;
#endif

#pragma debug(on)

layout (location = 0) out vec3 gPosition;
layout (location = 1) out vec3 gNormal;
layout (location = 2) out vec4 gAlbedoSpec;
layout (location = 3) out vec4 gDepth;

in vec2 TexCoord;
in vec3 FragPos;
in vec3 Normal;

uniform vec4 baseColorFactor;
uniform sampler2D baseColorTex;

void main()
{    
    gPosition = FragPos;
    gNormal = normalize(Normal);
    gAlbedoSpec.rgb = (texture(baseColorTex, TexCoord) * baseColorFactor).rgb;
    gAlbedoSpec.a = 0.5;
    gDepth.r = gl_FragCoord.z;
}  