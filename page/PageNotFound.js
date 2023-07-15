import AppPage from './Page';

import { gettext } from 'i18n';

class PageNotFound extends AppPage {
  onInit() {
    this.drawTextMessage(gettext("pagenotfound"));
  }
}

export default PageNotFound;
