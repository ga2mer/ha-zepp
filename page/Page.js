const TOP_BOTTOM_OFFSET = 46;

const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = hmSetting.getDeviceInfo();


class AppPage {
  constructor(app, id, params) {
    this.app = app;
    this.id = id;
    this.router = app.router;
    this.params = params;
    this.widgets = [];
    this.state = {
      rendered: false,
      y: TOP_BOTTOM_OFFSET,
    };
  }

  onInit() { }

  onRender() { }

  onDestroy() { }

  setState(nextState = {}) {
    Object.keys(nextState).forEach((key) => {
      this.state[key] = nextState[key];
    });
    this.onRender();
  }

  createWidget(...args) {
    return this.app.createWidget(...args);
  }

  clearWidgets() {
    this.app.clearWidgets();
    this.state.y = TOP_BOTTOM_OFFSET;
  }

  addWidgets(widgets) {
    this.app.widgets.push(...widgets);
  }

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
  }

  drawNoBLEConnect() {
    return this.drawTextMessage("No connection to\n the application");
  }

  drawWait(message = null) {
    let text = 'Loading...'
    if (message)
      text += "\n" + message
    return this.drawTextMessage(text);
  }

  drawError(message) {
    let text = "An error occurred";
    if (typeof message === 'string') {
      text += ':\n';
      text += message;
    }
    return this.drawTextMessage(text);
  }
}

export default AppPage;
