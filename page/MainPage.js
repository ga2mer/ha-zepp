import App from './App';

Page({
  state: {
    app: null,
  },
  onInit() {
    const app = new App();
    this.state.app = app;
    this.state.app.init();
  },
  build() {
  },
  onDestroy() {
    this.state.app.destroy();
  }
});
