// import { getScrollListDataConfig } from '../../utils'
import { DEVICE_HEIGHT, DEVICE_WIDTH, TOP_BOTTOM_OFFSET } from "./index.style";

import { isHmAppDefined } from "../../shared/js-module"

const { messageBuilder } = getApp()._options.globalData;

const logger = DeviceRuntimeCore.HmLogger.getLogger("helloworld");

Page({
  state: {
    scrollList: null,
    dataList: [],
    widgets: [],
    rendered: false,
    y: TOP_BOTTOM_OFFSET,
  },
  build() {
    logger.debug("page build invoked");
    hmUI.setLayerScrolling(true);
  },
  getSensorsList() {
    messageBuilder
      .request({ method: "GET_SENSORS_LIST" })
      .then(({ result, error }) => {
        if (error) {
          this.drawError(error);
          return;
        }
        this.state.dataList = result;
        this.createAndUpdateList();
      })
      .catch((res) => {
        this.drawError();
        console.log(res);
      });
  },
  toggleSwitchable(item, value) {
    messageBuilder.request({ method: "TOGGLE_SWITCH", entity_id: item.key, value, service: item.type });
  },
  clearWidgets() {
    this.state.widgets.forEach((widget, index) => {
      hmUI.deleteWidget(widget);
    });
    this.state.widgets = [];
    this.state.y = TOP_BOTTOM_OFFSET; // start from this y to skip rounded border
    // hmUI.redraw();
  },
  createWidget(...args) {
    const widget = hmUI.createWidget(...args);
    this.state.widgets.push(widget);
    return widget;
  },
  createSensor(item) {
    const titleHeight = 32;
    const valueHeight = 32;
    const sensorsGap = 10;
    const totalHeight = titleHeight + valueHeight + sensorsGap;
    this.createWidget(hmUI.widget.TEXT, {
      x: 0,
      y: this.state.y,
      w: DEVICE_WIDTH,
      h: titleHeight,
      text: item.title,
      text_size: 17,
      color: 0xaaaaaa,
      align_h: hmUI.align.CENTER_H,
    });
    this.createWidget(hmUI.widget.TEXT, {
      x: 0,
      y: this.state.y + titleHeight,
      w: DEVICE_WIDTH,
      h: valueHeight,
      text: item.state,
      text_size: 16,
      color: 0xffffff,
      align_h: hmUI.align.CENTER_H,
    });
    this.state.y += totalHeight;
  },
  createSwitchable(item) {
    const titleHeight = 32;
    const valueHeight = 48;
    const sensorsGap = 10;
    const totalHeight = titleHeight + valueHeight + sensorsGap;
    this.createWidget(hmUI.widget.TEXT, {
      x: 0,
      y: this.state.y,
      w: DEVICE_WIDTH,
      h: titleHeight,
      text: item.title,
      text_size: 17,
      color: 0xaaaaaa,
      align_h: hmUI.align.CENTER_H,
    });
    this.createWidget(hmUI.widget.SLIDE_SWITCH, {
      x: DEVICE_WIDTH / 2 - 76 / 2,
      y: this.state.y + titleHeight,
      w: DEVICE_WIDTH,
      h: valueHeight,
      select_bg: "switch_on.png",
      un_select_bg: "switch_off.png",
      slide_src: "radio_select.png",
      slide_select_x: 32,
      slide_un_select_x: 8,
      checked: item.state === "on" ? true : false,
      checked_change_func: (slideSwitch, checked) => {
        if (!this.state.rendered) return;
        this.toggleSwitchable(item, checked);
      },
    });

    if (item.type === "light") {
      const iconsize = 24
      const details_button = this.createWidget(hmUI.widget.IMG, {
        x: DEVICE_WIDTH - iconsize - 5,
        y: this.state.y + titleHeight + valueHeight / 2 - iconsize / 2,
        src: "forward24.png"
      });
      details_button.addEventListener(hmUI.event.CLICK_UP, (info) => {
        hmApp.gotoPage({ file: `page/${item.type}/index.page`, param: JSON.stringify(item) })
      })
      this.state.y += totalHeight;
    }

  },
  createElement(item) {
    if (item === "end") {
      return this.createWidget(hmUI.widget.TEXT, {
        x: 0,
        y: this.state.y,
        w: DEVICE_WIDTH,
        h: TOP_BOTTOM_OFFSET,
        text: "",
      });
    }
    if (typeof item !== 'object' || typeof item.type !== 'string') return;
    if (
      ["light", "switch"].includes(item.type) &&
      item.state !== "unavailable"
    ) {
      return this.createSwitchable(item);
    }
    return this.createSensor(item);
  },
  createAndUpdateList(showEmpty = true) {
    this.clearWidgets();
    this.state.rendered = false;
    this.state.dataList.forEach((item) => {
      this.createElement(item);
    });
    this.createElement("end");
    this.state.rendered = true;
  },
  drawTextMessage(message, button) {
    this.clearWidgets();
    this.createWidget(hmUI.widget.TEXT, {
      x: 0,
      y: 0,
      w: DEVICE_WIDTH,
      h: DEVICE_HEIGHT,
      text: message,
      text_size: 18,
      color: 0xffffff,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
    });
    if (button) {
      const buttonParams = {};
      if (button.buttonColor) {
        buttonParams.normal_color = button.buttonColor;
      }
      if (button.buttonPressedColor) {
        buttonParams.press_color = button.buttonPressedColor;
      }
      if (button.textColor) {
        buttonParams.text_color = button.textColor;
      }
      if (typeof button.onClick === 'function') {
        buttonParams.click_func = button.onClick;
      }
      this.createWidget(hmUI.widget.BUTTON, {
        x: DEVICE_WIDTH / 2 - 50,
        y: DEVICE_HEIGHT - (TOP_BOTTOM_OFFSET * 3),
        text: button.text,
        w: 100,
        h: 50,
        radius: 4,
        normal_color: 0x333333,
        press_color: 0x444444,
        ...buttonParams,
      })
    }
    return;
  },
  drawNoBLEConnect() {
    return this.drawTextMessage("No connection to\n the application");
  },
  drawWait() {
    return this.drawTextMessage('Loading...');
  },
  drawError(message) {
    let text = "An error occurred";
    if (typeof message === 'string') {
      text += ':\n';
      text += message;
    }
    return this.drawTextMessage(text);
  },
  onInit() {
    if (hmBle.connectStatus()) {
      this.drawWait();
      this.getSensorsList();
    } else {
      this.drawNoBLEConnect();
    }
    logger.debug("page onInit invoked");
    messageBuilder.on("call", ({ payload: buf }) => {
      const data = messageBuilder.buf2Json(buf);
      if (data.action === "listUpdate") {
        this.state.dataList = data.value;
        this.createAndUpdateList();
      }
    });
  },

  onDestroy() {
    logger.debug("page onDestroy invoked");
  },
});
