import { blendRGBColors, rgbColorPack, rgbColorUnpack, shadeRGBColor } from "../../utils";
import AppPage from "../Page";

import {
  DEVICE_HEIGHT,
  DEVICE_WIDTH,
  TOP_BOTTOM_OFFSET,
} from "../home/index.style";

import { gettext } from 'i18n'

const { messageBuilder } = getApp()._options.globalData;
const logger = DeviceRuntimeCore.HmLogger.getLogger("ha-zepp-light-colorPicker");

class ColorPicker extends AppPage {
  constructor(...props) {
    super(...props);
    this.state.item = null;
    this.state.rendered = false;
    this.state.reloadTimer = null;
    this.state.selectRect = null;
    this.state.colorPill = null;
    this.state.selectedColorX = 0;
    this.state.selectedColorY = 0;
    this.state.lastY = 0;
  }
  addWidget(widget) {
    this.app.widgets.push(...widget);
  }
  drawElements() {
    this.state.rendered = false;
    this.clearWidgets();

    if (typeof this.state.item !== "object") {
      this.drawError(gettext("wrongsendata") + typeof this.state.item);
      return;
    }

    const titleHeight = 40;

    this.createWidget(hmUI.widget.TEXT, {
      x: 0,
      y: this.state.y,
      w: DEVICE_WIDTH,
      h: titleHeight,
      text: this.state.item.title,
      text_size: 19,
      color: 0xffffff,
      align_h: hmUI.align.CENTER_H,
    });
    this.state.y += titleHeight;

    if (this.state.item.attributes.rgb_color) {
      const titleHeight = 32;
      const rectSize = 24
      this.createWidget(hmUI.widget.TEXT, {
        x: 10,
        y: this.state.y,
        w: DEVICE_WIDTH / 3,
        h: titleHeight,
        text: gettext("color"),
        text_size: 17,
        color: 0xffffff,
        align_h: hmUI.align.LEFT,
      });

      const colorPillY = this.state.y + titleHeight / 2 - rectSize / 2
      this.state.colorPill = this.createWidget(hmUI.widget.BUTTON, {
        x: 10 + DEVICE_WIDTH / 3,
        y: colorPillY,
        w: DEVICE_WIDTH / 3 * 2 - 20,
        h: rectSize,
        radius: rectSize / 2,
        normal_color: rgbColorPack(this.state.item.attributes.rgb_color),
        press_color: rgbColorPack(shadeRGBColor(this.state.item.attributes.rgb_color, -0.3)),
        click_func: () => {
          let scrollY = this.state.selectedColorY - DEVICE_HEIGHT / 2 + TOP_BOTTOM_OFFSET
          hmApp.setLayerY(-1 * Math.min(Math.max(scrollY, 0), this.state.lastY))
        }
      })

      this.state.y += titleHeight + 20;

      const colorRectSize = 54;

      const onColorSelect = (color, posX, posY) => {
        this.state.selectRect.setProperty(hmUI.prop.MORE, {
          x: posX,
          y: posY,
          h: colorRectSize,
          w: colorRectSize
        })

        this.state.colorPill.setProperty(hmUI.prop.MORE, {
          x: 10 + DEVICE_WIDTH / 3,
          y: colorPillY,
          w: DEVICE_WIDTH / 3 * 2 - 20,
          h: rectSize,
          normal_color: rgbColorPack(color),
          press_color: rgbColorPack(shadeRGBColor(color, -0.3))
        })

        this.state.item.attributes.rgb_color = color
        this.state.selectedColorX = posX
        this.state.selectedColorY = posY

        if (this.state.rendered) {
          messageBuilder.request({
            method: "LIGHT_SET",
            entity_id: this.state.item.key,
            value: JSON.stringify({ rgb_color: color }),
            service: this.state.item.type,
          });
        }
      }

      this.state.selectedColorX = 10;
      this.state.selectedColorY = this.state.y;

      var baseColors = [0x00ff00, 0x00ffff, 0x0000ff, 0xff00ff, 0xff0000, 0xffff00, 0x00ff00]

      for (var i = 0; i < baseColors.length - 1; i++) {
        for (var j = 0; j < 4; j++) {

          let midcolor = blendRGBColors(rgbColorUnpack(baseColors[i]), rgbColorUnpack(baseColors[i + 1]), 0.25 * j)
          var nextX = 10

          //to not draw green again
          if (i == (baseColors.length - 2) && j == 3) continue

          for (var s = 0; s < 3; s++) {
            let shadecolor = blendRGBColors(midcolor, [255, 255, 255], (1 / 3) * s)

            let rectX = nextX
            let rectY = this.state.y
            let colorrect = this.createWidget(hmUI.widget.BUTTON, {
              x: nextX,
              y: this.state.y,
              h: colorRectSize,
              w: colorRectSize,
              radius: colorRectSize / 2,
              normal_color: rgbColorPack(shadecolor),
              press_color: rgbColorPack(shadecolor),
              click_func: () => {
                onColorSelect(shadecolor, rectX, rectY)
              }
            })

            let currcolor = this.state.item.attributes.rgb_color
            if (shadecolor[0] == currcolor[0] && shadecolor[1] == currcolor[1] && shadecolor[2] == currcolor[2]) {
              this.state.selectedColorX = nextX
              this.state.selectedColorY = this.state.y
            }

            nextX += colorRectSize + 5
          }
          this.state.y += colorRectSize + 5
        }
      }
      hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: 0,
        y: this.state.y,
        h: TOP_BOTTOM_OFFSET,
        w: DEVICE_WIDTH
      })
      this.state.lastY = this.state.y + TOP_BOTTOM_OFFSET - DEVICE_HEIGHT

      this.state.selectRect = this.createWidget(hmUI.widget.STROKE_RECT, {
        x: this.state.selectedColorX,
        y: this.state.selectedColorY,
        h: colorRectSize,
        w: colorRectSize,
        line_width: 5,
        radius: colorRectSize / 2,
        color: 0xFFFFFF
      })
      this.state.selectRect.setEnable(false)
    } else {
      this.router.back();
    }

    this.state.rendered = true;
  }
  onInit(param) {
    logger.log("onInit");
    logger.log("param", param);
    this.state.item = param;
  }
  onRender() {
    this.drawElements();
    this.app.setLayerScrolling(true);
  }
  onDestroy() { hmApp.setLayerY(0) }
}

export default ColorPicker;
