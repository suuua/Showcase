// https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_lights_punctual/README.md

import Light from './base';
import LightDirectional from './lightDirectional';
import LightPoint from './lightPoint';
import LightSpot from './lightSpot';

Light.LightDirectional = LightDirectional;
Light.LightPoint = LightPoint;
Light.LightSpot = LightSpot;

export default Light;
