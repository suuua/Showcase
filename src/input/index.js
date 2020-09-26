/**
 * 将各种输入转换为变换矩阵
 */
export default class Input {
  constructor({ canvas }) {
    this.$canvas = canvas;

    this.$deltaWhell = 0;
    this.$deltaRotate = [0, 0, 0, 1];
    this.$deltaTranslate = [0, 0, 0];
    // scale
    const MAX_SCALE = 0.01;
    const MIN_SCALE = -0.01;
    canvas.addEventListener('wheel', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const { deltaY } = event;
      // 限制每帧的最小，最大放大速度
      this.$deltaScale += (deltaY / 100) * 0.05;
      if (this.$deltaScale < MIN_SCALE) {
        this.$deltaScale = MIN_SCALE;
      } else if (this.$deltaScale > MAX_SCALE) {
        this.$deltaScale = MAX_SCALE;
      }
    });

    // rotate
    let canRotate = false;
    let startX = 0;
    let startY = 0;
    canvas.addEventListener('mousedown', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const { offsetX, offsetY, button } = event;
      if (button !== 0) { return; }
      canRotate = true;
      startX = offsetX;
      startY = offsetY;
    });
    canvas.addEventListener('mousemove', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!canRotate) { return; }
      // TODO: compute rotate
      startX = event.offsetX;
      startY = event.offsetY;
    });
    canvas.addEventListener('mouseup', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const { button } = event;
      if (button !== 0) { return; }
      canRotate = false;
      // eslint-disable-next-line
      startX = 0;
      // eslint-disable-next-line
      startY = 0;
    });

    // translate
    canvas.addEventListener('keydown', (event) => {
      event.preventDefault();
      event.stopPropagation();
      console.log(event);
    });
    canvas.addEventListener('keyup', (event) => {
      event.preventDefault();
      event.stopPropagation();
      console.log(event);
    });
  }

  // shader每帧会读取一次
  get deltaScale() {
    const deltaScale = this.$deltaScale;
    this.$deltaScale = 0;
    return [deltaScale, deltaScale, deltaScale];
  }

  get deltaRotate() {
    const deltaRotate = this.$deltaRotate;
    this.$deltaRotate = [0, 0, 0, 1];
    return deltaRotate;
  }

  get deltaTranslate() {
    const deltaTranslate = this.$deltaTranslate;
    this.$deltaTranslate = [0, 0, 0];
    return deltaTranslate;
  }

  processInput() {

  }

}