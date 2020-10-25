/**
 * 将各种输入转换为变换矩阵
 * Tips:
 * 考虑下是否可以直接保存原始的按键值，比如deltaWhell = 100这种相对变换值，
 * 在每帧中去获取这个值，然后传给操作脚本去使用这个值，由操作脚本去实现具体的功能。
 */
export default class Input {
  constructor({ canvas }) {
    this.$canvas = canvas;

    // this.$deltaScale = 0;
    this.$deltaMouseMoveX = 0;
    this.$deltaMouseMoveY = 0;
    this.$deltaTranslate = [0, 0, 0];
    this.$key = {};
    // scale
    // const MAX_SCALE = 0.01;
    // const MIN_SCALE = -0.01;
    // canvas.addEventListener('wheel', (event) => {
    //   event.preventDefault();
    //   event.stopPropagation();
    //   const { deltaY } = event;
    //   // 限制每帧的最小，最大放大速度
    //   this.$deltaScale += (deltaY / 100) * 0.05;
    //   if (this.$deltaScale < MIN_SCALE) {
    //     this.$deltaScale = MIN_SCALE;
    //   } else if (this.$deltaScale > MAX_SCALE) {
    //     this.$deltaScale = MAX_SCALE;
    //   }
    // });

    // rotate
    let inCanvas = false;
    let startX = 0;
    let startY = 0;
    canvas.addEventListener('mousedown', (event) => {
      const { offsetX, offsetY, button } = event;
      if (button !== 0) { return; }
      inCanvas = true;
      startX = offsetX;
      startY = offsetY;
    });
    canvas.addEventListener('mousemove', (event) => {
      if (!inCanvas) { return; }
      this.$deltaMouseMoveX = event.offsetX - startX;
      this.$deltaMouseMoveY = event.offsetY - startY;
      startX = event.offsetX;
      startY = event.offsetY;
    });
    canvas.addEventListener('mouseup', (event) => {
      const { button } = event;
      if (button !== 0) { return; }
      inCanvas = false;
      this.$key = {};
      // eslint-disable-next-line
      startX = 0;
      // eslint-disable-next-line
      startY = 0;
    });
    canvas.addEventListener('mouseleave', (event) => {
      const { button } = event;
      if (button !== 0) { return; }
      inCanvas = false;
      this.$key = {};
      // eslint-disable-next-line
      startX = 0;
      // eslint-disable-next-line
      startY = 0;
    });

    // translate
    // let focusCanvas = false;
    // canvas.addEventListener('focus', () => {
    //   focusCanvas = true;
    //   console.log('focus');
    // });
    // canvas.addEventListener('blur', () => {
    //   focusCanvas = false;
    //   this.$key = {};
    // });
    document.addEventListener('keydown', (event) => {
      const { code } = event;
      if (!inCanvas) { return; }
      this.$key[code] = true;
    });
    document.addEventListener('keyup', (event) => {
      const { code } = event;
      this.$key[code] = false;
    });
  }

  // shader基本会每帧读取一次
  // get deltaScale() {
  //   const deltaScale = this.$deltaScale;
  //   this.$deltaScale = 0;
  //   return [deltaScale, deltaScale, deltaScale];
  // }

  get deltaMouseMoveX() {
    const deltaMouseMoveX = this.$deltaMouseMoveX;
    this.$deltaMouseMoveX = 0;
    return deltaMouseMoveX;
  }

  get deltaMouseMoveY() {
    const deltaMouseMoveY = this.$deltaMouseMoveY;
    this.$deltaMouseMoveY = 0;
    return deltaMouseMoveY;
  }

  get deltaTranslate() {
    const deltaTranslate = this.$deltaTranslate;
    this.$deltaTranslate = [0, 0, 0];
    return deltaTranslate;
  }

  get key() {
    return { ...this.$key };
  }

  processInput() {
    return {
      // deltaScale: this.deltaScale,
      deltaMouseMoveX: this.deltaMouseMoveX,
      deltaMouseMoveY: this.deltaMouseMoveY,
      deltaTranslate: this.deltaTranslate,
      key: this.key,
    };
  }
}
