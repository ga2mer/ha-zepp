import { getEveryNth } from "../../utils";
import AppPage from "../Page";
import { ACCENT_COLOR, BUTTON_COLOR_PRESSED, DEVICE_HEIGHT, DEVICE_WIDTH, TOP_BOTTOM_OFFSET } from "../home/index.style";

const logger = DeviceRuntimeCore.HmLogger.getLogger("ha-zepp-info");
const { messageBuilder } = getApp()._options.globalData;

import { gettext } from 'i18n'

class InfoPage extends AppPage {
    constructor(...props) {
        super(...props);
    }

    getInfo() {
        messageBuilder
            .request({ method: "GET_SERVER_INFO" })
            .then(({ result, error }) => {
                if (error) {
                    this.drawError(error);
                    return;
                }
                this.info = result;
                this.drawElements();
            })
            .catch((res) => {
                this.drawError();
            });
    }

    drawElements() {
        this.state.rendered = false;
        this.clearWidgets()

        const titleHeight = 40;

        this.createWidget(hmUI.widget.TEXT, {
            x: 0,
            y: this.state.y,
            w: DEVICE_WIDTH,
            h: titleHeight,
            text: this.info.location_name,
            text_size: 19,
            color: 0xffffff,
            align_h: hmUI.align.CENTER_H,
        });
        this.state.y += titleHeight + 10

        const logoSize = 100;

        this.createWidget(hmUI.widget.IMG, {
            x: DEVICE_WIDTH / 2 - logoSize / 2,
            y: this.state.y,
            w: logoSize,
            h: logoSize,
            src: "icon.png"
        })

        this.state.y += logoSize + 10

        const textHeight = 30;
        this.createWidget(hmUI.widget.TEXT, {
            x: 0,
            y: this.state.y,
            w: DEVICE_WIDTH / 3,
            h: textHeight,
            text: gettext('state'),
            text_size: 17,
            color: 0xffffff,
        });

        this.createWidget(hmUI.widget.TEXT, {
            x: DEVICE_WIDTH / 3,
            y: this.state.y,
            w: DEVICE_WIDTH / 3 * 2,
            h: textHeight,
            text: gettext(this.info.state),
            text_size: 17,
            color: 0xffffff,
        });
        this.state.y += titleHeight


        this.createWidget(hmUI.widget.TEXT, {
            x: 0,
            y: this.state.y,
            w: DEVICE_WIDTH / 2,
            h: textHeight,
            text: gettext('safemode'),
            text_size: 17,
            color: 0xffffff,
        });

        this.createWidget(hmUI.widget.TEXT, {
            x: DEVICE_WIDTH / 2,
            y: this.state.y,
            w: DEVICE_WIDTH / 2,
            h: textHeight,
            text: this.info.safe_mode ? gettext("on") : gettext("off"),
            text_size: 17,
            color: 0xffffff,
        });

        this.state.y += titleHeight


        this.createWidget(hmUI.widget.TEXT, {
            x: 0,
            y: this.state.y,
            w: DEVICE_WIDTH,
            h: textHeight,
            text: gettext('version') + this.info.version,
            text_size: 17,
            color: 0xffffff,
        });

        this.state.y += titleHeight

        this.createWidget(hmUI.widget.TEXT, {
            x: 0,
            y: this.state.y,
            w: DEVICE_WIDTH,
            h: textHeight,
            text: gettext('language') + this.info.language,
            text_size: 17,
            color: 0xffffff,
        });

        this.state.y += titleHeight

        this.createWidget(hmUI.widget.TEXT, {
            x: 0,
            y: this.state.y,
            w: DEVICE_WIDTH / 2,
            h: textHeight,
            text: gettext('timezone'),
            text_size: 17,
            color: 0xffffff,
        });

        this.createWidget(hmUI.widget.TEXT, {
            x: DEVICE_WIDTH / 2,
            y: this.state.y,
            w: DEVICE_WIDTH / 2,
            h: textHeight,
            text: this.info.time_zone,
            text_size: 17,
            color: 0xffffff,
        });

        this.state.y += titleHeight

        this.state.rendered = true;
    }

    onInit(param) {
        logger.log('onInit')
    }

    onRender() {
        this.drawWait()
        this.getInfo()
    }

    onDestroy() {
        this.state.rendered = false
    }
}

export default InfoPage;