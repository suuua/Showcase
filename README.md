# showcase

目标是像图片一样能够低成本的播放3D物体

## TODO List

1. 支持GLT2文件加载。首先仅支持以下类别：
   - mesh
   - transform (translate, rotate, scale)
   - material
   - light
   - camera
   - skybox
2. Standard shader 用于渲染单个场景中的游戏对象。支持面剔除，透明物体等
3. 重写渲染部分js代码。
4. 场景文件的解析可能需要大量耗时，这里使用Worker来处理。
5. 减少浮点运算数精度来加快运算速度
6. 材质的渲染中需要学习并实现 PBR（Physically Based Rendering）

## QUESTION

1. 在光的强度'intensity'中，GLTF定义为[lm/sr(cd)或lm/m^2(lx)](https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_lights_punctual/README.md)。但是在blender中对点光源和聚光源直接使用能量(乘方)'w'作为单位，太阳光强度为w/m^2而点聚光源光源能量为w。blender在导出GLTF文件时直接将能量表示的单位写入到'intensity'中，没有进行换算。导致blender的光照效果与GLTF的严重脱节。