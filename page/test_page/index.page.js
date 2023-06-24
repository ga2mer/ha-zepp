import AppPage from "../Page";

import { DEVICE_WIDTH } from "../home/index.style";
import { createSlider } from "../../controls/slider";
const { messageBuilder } = getApp()._options.globalData;
const logger = DeviceRuntimeCore.HmLogger.getLogger("ha-zepp-testpage");

class Index extends AppPage {
  constructor(...props) {
    super(...props);
    this.state.rendered = false;
  }
  addWidget(widget) {
    this.app.widgets.push(...widget);
  }
  drawSlider() {
    const titleHeight = 32;
    /* brightness slider */
    this.createWidget(hmUI.widget.TEXT, {
      x: 10,
      y: this.state.y,
      w: (DEVICE_WIDTH / 3) * 2,
      h: titleHeight,
      text: "Value",
      text_size: 17,
      color: 0xffffff,
      align_h: hmUI.align.LEFT,
    });

    const sliderText = this.createWidget(hmUI.widget.TEXT, {
      x: (DEVICE_WIDTH / 3) * 2 + 10,
      y: this.state.y,
      w: DEVICE_WIDTH / 3 - 20,
      h: titleHeight,
      text: "50%",
      text_size: 17,
      color: 0xffffff,
      align_h: hmUI.align.RIGHT,
    });
    this.state.y += titleHeight + 10;

    const brightnessSlider = createSlider({
      h: 12,
      w: 150,
      x: DEVICE_WIDTH / 2 - 150 / 2,
      y: this.state.y,
      backColor: 0x0884d0,
      frontColor: 0xffffff,
      hasPoint: true,
      ctx: this,
      onSliderMove: (ctx, floatvalue, isUserInput) => {
        floatvalue = Math.round(floatvalue * 100);
        sliderText.setProperty(hmUI.prop.MORE, {
          text: floatvalue.toString() + "%",
        });
        if (ctx.state.rendered && isUserInput)
          console.log("userinput", floatvalue);
      },
    });
    this.state.y += 12 * 2 + 20;

    brightnessSlider.setPosition(0.5);

    this.addWidget(brightnessSlider.components);
  }
  drawElements() {
    this.state.rendered = false;
    this.clearWidgets();

    this.drawSlider();

    const volumeSlider = createSlider({
      h: 12,
      w: 150,
      x: DEVICE_WIDTH / 2 - 150 / 2,
      y: this.state.y,
      backColor: 0x262626,
      frontColor: 0xffffff,
      hasPoint: false,
      ctx: this,
      onSliderMove: (ctx, floatvalue, isUserInput) => {
        if (ctx.state.rendered && isUserInput)
          console.log("userinput", floatvalue);
      },
    });
    this.state.y += 12 * 2 + 20;
    this.addWidget(volumeSlider.components);

    const buttonSlider = createSlider({
      h: 24,
      w: 150,
      x: DEVICE_WIDTH / 2 - 150 / 2,
      y: this.state.y,
      backColor: 0x262626,
      frontColor: 0xffffff,
      hasPoint: false,
      buttons: {
        img_down: "brightness_down.png",
        img_up: "brightness_up.png",
        change_amt: 0.1,
      },
      ctx: this,
      onSliderMove: (ctx, floatvalue, isUserInput) => {
        if (ctx.state.rendered && isUserInput)
          console.log("userinput", floatvalue);
      },
    });
    this.state.y += 12 * 2 + 20;
    this.addWidget(buttonSlider.components);

    this.state.rendered = true;
  }
  onInit() {
    logger.log("onInit");
    this.drawElements();
  }
  onDestroy() {
    return { foo: 'bar' };
  }
}

export default Index;
