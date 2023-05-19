import Router from './Router';

class App {
  constructor() {
    this.router = new Router(this);
    this.widgets = [];
  }
  createWidget(...args) {
    const widget = hmUI.createWidget(...args);
    this.widgets.push(widget);
    return widget;
  }
  clearWidgets() {
    this.widgets.forEach((widget, index) => {
      hmUI.deleteWidget(widget);
    });
    this.widgets = [];
    // hmUI.redraw();
  }
  init() {
    this.router.init();
    this.router.go('home');
    const self = this;
    hmApp.registerGestureEvent(function (event) {
      switch (event) {
        case hmApp.gesture.RIGHT:
          self.router.back();
          break
        default:
          break
      }
      return true;
    });
    // press backspace in simulator to emulate back gesture
    hmApp.registerKeyEvent(function (key, action) {
      if (key === hmApp.key.BACK && action === hmApp.action.RELEASE) {
        self.router.back();
      }
      return false;
    });
  }
  destroy() {
    this.clearWidgets();
    hmApp.unregisterGestureEvent();
  }
}

export default App;