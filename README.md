# showcase

目标是像图片一样能够低成本的播放3D物体

## TODO List

1. 支持GLT2文件加载。首先仅支持以下类别：
   - mesh
   - transform (translate, rotate, scale)
   - material
   - light
   - camera
   - mouse input
   - skybox
2. Standard shader 用于渲染单个场景中的游戏对象。支持面剔除，透明物体等
3. 重写渲染部分js代码。
4. 场景文件的解析可能需要大量耗时，这里使用Worker来处理。
