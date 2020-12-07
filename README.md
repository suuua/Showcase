# showcase

目标是像图片一样能够低成本的播放3D物体

## TODO List

1. 支持GLT2文件加载。待支持以下类别：
   - skybox
   - animation
   - extendsion
   - extra
   - samplers
   - 透明物体
2. 重写渲染部分js代码。
3. 场景文件的解析可能需要大量耗时，这里使用Worker来处理。
4. 减少浮点运算数精度来加快运算速度
5. 需要优化卡顿的问题
6. 文件没有光源情况下默认光源的添加

## QUESTION

1. 在光的强度'intensity'中，GLTF定义为[lm/sr(cd)或lm/m^2(lx)](https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_lights_punctual/README.md)。但是在blender中对点光源和聚光源直接使用能量(乘方)'w'作为单位，太阳光强度为w/m^2而点聚光源光源能量为w。blender在导出GLTF文件时直接将能量表示的单位写入到'intensity'中，没有进行换算。导致blender的光照效果与GLTF的严重脱节。
2. 多光源渲染下使用 实时光线追踪（离线渲染，速度特别慢需要2分钟的渲染时间）还是集群延迟渲染？

## note

集群延迟渲染的论文目前完全看不懂[原文](http://www.cse.chalmers.se/~uffe/clustered_shading_preprint.pdf)[机器翻译](https://blog.csdn.net/magr_lemon/article/details/84571369)。这篇论文基于分块渲染和一些数学，图形学知识，导致完全看不懂。gitHub上有人实现了集群延迟渲染[Project5-WebGL-Clustered-Deferred-Forward-Plus](https://github.com/byumjin/Project5-WebGL-Clustered-Deferred-Forward-Plus)。因此尝试先实现延迟渲染然后试着研究并移植gitHub上的代码。

在阴影与光照反面，光线追踪是目前最为理想的方式，但是光线追踪和阴影映射阴影体积是两种不同的实现。光线追踪主要是依据光线的物理特性（多个物体间反射，折射）来实现，其需要使用CPU来进行大量的计算。由于OpenGl基于光栅化，因而无法实现光线追踪算法，只能使用阴影映射，阴影体积这种类似算法。

## 参考文档

[webgl 指南](https://www.khronos.org/registry/webgl/specs/latest/1.0/index.html)
[OpenGL GLSL ES 指南](https://www.khronos.org/registry/OpenGL/specs/es/3.0/GLSL_ES_Specification_3.00.pdf)
[OpenGL ES 指南](https://www.khronos.org/registry/OpenGL/specs/es/3.0/es_spec_3.0.pdf)
[OpenGL ES API 手册](https://www.khronos.org/registry/OpenGL-Refpages/es3.0/)
[webGL1 API 手册](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getContextAttributes)
[webGL2 API 手册](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext)
[OpenGL 学习教程](https://learnopengl-cn.github.io/)
[GLTF 文件 指南](https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#specifying-extensions)
[blender 文档](https://docs.blender.org/manual/zh-hans/2.90/render/lights/light_object.html#sun-light)
