# Shader

WebGL使用的是openGL ES 2.0 的API，它和openGL并不一样，因此在openGL上需要的GLSL版本注释并不适用。

## TODO

1. 图像，材质，贴图，纹理坐标这些是可复用GPU内存的数据，应该使用享元来共享？ 还是使用缓存来共享
