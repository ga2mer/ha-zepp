// import UniversalRouter from 'universal-router';
import HomePage from './home/index.page';
import LightPage from './light/index.page';
import EffectPicker from './light/effectPicker.page';
import MediaPlayer from './media_player/index.page';
import TestPage from './test_page/index.page';
import PageNotFound from './PageNotFound';

class Router {
  constructor(app) {
    this.app = app;
    this.routes = {
      'home': HomePage,
      'light': LightPage,
      'light/effect_picker': EffectPicker,
      'media_player': MediaPlayer,
      'test_page': TestPage,
    };
    this.pageId = 0;
    this.history = [];
  }
  init() {}
  destroy() {}
  go(path, params = {}) {
    let Module = this.routes[path];
    if (!Module) Module = PageNotFound; // render 404;
    this.app.clearWidgets();
    this.pageId += 1;
    const module = new Module(this.app, this.pageId, params);
    module.onInit(params);
    module.onRender();
    this.history.push({
      path,
      page: module,
    });
  }
  getCurrentPage() {
    const lastItem = this.history[this.history.length - 1];
    return lastItem.page;
  }
  getCurrentPageId() {
    const lastItem = this.getCurrentPage();
    return lastItem.id;
  }
  back(params) {
    try {
      this.app.clearWidgets();
      const currentPage = this.getCurrentPage();
      if (currentPage.onDestroy) {
        currentPage.onDestroy();
      }
      if (this.history.length === 1) {
        return hmApp.goBack();
      }
      this.history.pop();
      const previousPage = this.getCurrentPage();
      if (previousPage.onBack) {
        previousPage.onBack(params);
      }
      if (previousPage.onRender) {
        previousPage.onRender();
      }
    } catch (e) {
      console.log(e.message);
      hmUI.showToast({
        text: 'Crash'
      })
    }
  }
}

export default Router;