import AppPage from './Page';

class PageNotFound extends AppPage {
  onInit() {
    this.drawTextMessage('Page not found');
  }
}

export default PageNotFound;
