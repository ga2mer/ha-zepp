import AppPage from '../Page';

import { BUTTON_COLOR_NORMAL, BUTTON_COLOR_PRESSED, DEVICE_HEIGHT, DEVICE_WIDTH, TOP_BOTTOM_OFFSET } from "./index.style";

const { messageBuilder } = getApp()._options.globalData;

const logger = DeviceRuntimeCore.HmLogger.getLogger("ha-zepp-main");


class Index extends AppPage {
  constructor(...props) {
    super(...props);
    this.state.dataList = [];
    this.state.loading = false;
    this.onMessage = this.onMessage.bind(this);
  }
  onMessage({ payload: buf }) {
    const data = messageBuilder.buf2Json(buf);
    if (data.action === "listUpdate") {
      this.state.dataList = data.value;
      if (this.id !== this.router.getCurrentPageId()) return;
      this.createAndUpdateList();
    }
  }
  onInit(param) {
    if (hmBle.connectStatus()) {
      this.setState({
        loading: true,
      });
      this.getSensorsList();
    } else {
      this.setState({
        error: true,
      });
    }
    messageBuilder.on("call", this.onMessage);
  }
  onRender() {
    this.app.setLayerScrolling(true);
    if (this.state.loading) {
      this.drawWait();
    } else if (this.state.error) {
      this.drawNoBLEConnect();
    } else {
      this.createAndUpdateList();
    }
  }
  getSensorsList() {
    messageBuilder
      .request({ method: "GET_SENSORS_LIST" })
      .then(({ result, error }) => {
        if (error) {
          this.drawError(error);
          return;
        }
        this.setState({
          dataList: result,
          loading: false,
        });
      })
      .catch((res) => {
        this.drawError();
        logger.log(res);
      });
  }
  toggleSwitchable(item, value) {
    messageBuilder.request({ method: "TOGGLE_SWITCH", entity_id: item.key, value, service: item.type });
  }
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
      text: item.state + (item.unit || ""),
      text_size: 16,
      color: 0xffffff,
      align_h: hmUI.align.CENTER_H,
    });

    if ((item.type === "light" || item.type === "media_player" || (item.type === "sensor" && !isNaN(item.state))) && item.state != "unavailable") {
      const iconsize = 24
      this.createWidget(hmUI.widget.BUTTON, {
        x: DEVICE_WIDTH - iconsize - 5,
        y: this.state.y + titleHeight + valueHeight / 2 - iconsize / 2,
        w: 24,
        h: 24,
        press_src: "forward24.png",
        normal_src: "forward24.png",
        click_func: () => {
          this.router.go(item.type, item);
        },
      });
    }
    this.state.y += totalHeight;
  }
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

    if (item.type === "light" || item.type === "media_player") {
      const iconsize = 24
      this.createWidget(hmUI.widget.BUTTON, {
        x: DEVICE_WIDTH - iconsize - 5,
        y: this.state.y + titleHeight + valueHeight / 2 - iconsize / 2,
        w: 24,
        h: 24,
        press_src: "forward24.png",
        normal_src: "forward24.png",
        click_func: () => {
          this.router.go(item.type, item);
        },
      });
    }
    this.state.y += totalHeight;
  }
  createElement(item) {
    if (item === "end") {
      let elem = this.createWidget(hmUI.widget.BUTTON, {
        x: 0,
        y: this.state.y,
        w: DEVICE_WIDTH,
        h: TOP_BOTTOM_OFFSET,
        text: "   ",
        click_func: () => {
          this.router.go('test_page');
        }
      });
      this.state.y += TOP_BOTTOM_OFFSET + 10
      return elem
    }
    if (typeof item !== 'object' || typeof item.type !== 'string') return;
    if (
      ["light", "switch"].includes(item.type) &&
      item.state !== "unavailable"
    ) {
      return this.createSwitchable(item);
    }
    return this.createSensor(item);
  }

  createInfoButton() {
    const imgSize = 36
    const buttonWidth = DEVICE_WIDTH / 4
    this.createWidget(hmUI.widget.BUTTON, {
      x: DEVICE_WIDTH / 2 - buttonWidth / 2,
      y: this.state.y,
      h: buttonWidth,
      w: buttonWidth,
      radius: buttonWidth / 2,
      normal_color: BUTTON_COLOR_NORMAL,
      press_color: BUTTON_COLOR_PRESSED,
      click_func: () => {
        this.router.go("info_page")
      }
    })
    let img = this.createWidget(hmUI.widget.IMG, {
      x: (DEVICE_WIDTH / 2 - buttonWidth / 2) + (buttonWidth - imgSize) / 2,
      y: this.state.y + (buttonWidth - imgSize) / 2,
      w: imgSize,
      h: imgSize,
      src: "info.png"
    })
    img.setEnable(false)
    this.state.y += buttonWidth + 10
  }

  createAndUpdateList(showEmpty = true) {
    this.clearWidgets();
    this.state.rendered = false;
    this.state.dataList.forEach((item) => {
      this.createElement(item);
    });
    this.state.y += 10
    this.createInfoButton()

    this.createElement("end");

    this.state.rendered = true;
  }
  onBack(props) {
    if (props.path === 'test_page') {
      logger.log(JSON.stringify(props));
    }
  }
  onDestroy() {
    messageBuilder.off("call", this.onMessage);
  }
}

export default Index;
