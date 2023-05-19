import AppPage from '../Page';

import { DEVICE_WIDTH } from "../home/index.style";
import { createSlider } from "../../controls/slider";
const { messageBuilder } = getApp()._options.globalData;
const logger = DeviceRuntimeCore.HmLogger.getLogger("ha-zepp-light");

class Index extends AppPage {
    constructor(...props) {
        super(...props);
        this.state.item = null;
        this.state.reloadTimer = null;
        this.state.rendered = false;
    }
    addWidgets(widgets) {
        this.app.widgets.push(...widgets);
    }
    drawWait() {
        return this.drawTextMessage(`Loading...\n${this.state.item.title}`);
    }
    getSensorInfo() {
        messageBuilder
            .request({ method: "GET_SENSOR", entity_id: this.state.item.key })
            .then(({ result, error }) => {
                if (error) {
                    this.drawError(error);
                    return;
                }
                this.state.item = result;
                this.drawElements();
            })
            .catch((res) => {
                this.drawError();
                console.log(res);
            });
    }
    drawSlider() {
        const titleHeight = 32;
        /* brightness slider */
        this.createWidget(hmUI.widget.TEXT, {
            x: 10,
            y: this.state.y,
            w: DEVICE_WIDTH / 3 * 2,
            h: titleHeight,
            text: "Brightness:",
            text_size: 17,
            color: 0xffffff,
            align_h: hmUI.align.LEFT,
        });

        const sliderText = this.createWidget(hmUI.widget.TEXT, {
            x: DEVICE_WIDTH / 3 * 2 + 10,
            y: this.state.y,
            w: DEVICE_WIDTH / 3 - 20,
            h: titleHeight,
            text: "50%",
            text_size: 17,
            color: 0xffffff,
            align_h: hmUI.align.RIGHT,
        });
        this.state.y += titleHeight + 10

        const brightnessSlider = createSlider(
            {
                x: 10,
                y: this.state.y,
                h: 24,
                w: DEVICE_WIDTH - 20,
                // backColor: 0x0884d0,
                // frontColor: 0xffffff,
                // hasPoint: true,
                backColor: 0x262626,
                frontColor: 0xffffff,
                hasPoint: false,
                buttons: { img_down: "brightness_down.png", img_up: "brightness_up.png", change_amt: 0.1 },
                ctx: this,
                onSliderMove: (ctx, floatvalue, isUserInput) => {
                    floatvalue = Math.round(floatvalue * 100)
                    sliderText.setProperty(hmUI.prop.MORE, { text: floatvalue.toString() + "%" })
                    if (ctx.state.rendered && isUserInput)
                        messageBuilder.request(
                            {
                                method: "LIGHT_SET",
                                entity_id: ctx.state.item.key,
                                value: `{"brightness_pct": ${floatvalue}}`,
                                service: ctx.state.item.type
                            });
                }
            })
        this.state.y += 24 + 20

        brightnessSlider.setPosition(this.state.item.attributes.brightness / 100)

        this.addWidgets(brightnessSlider.components)
    }
    drawColorWheel() {
        const titleHeight = 32;
        const rectSize = 24
        this.createWidget(hmUI.widget.TEXT, {
            x: 10,
            y: this.state.y,
            w: DEVICE_WIDTH - rectSize * 2 - 10,
            h: titleHeight,
            text: "Color:",
            text_size: 17,
            color: 0xffffff,
            align_h: hmUI.align.LEFT,
        });
        const color = this.state.item.attributes.rgb_color
        this.createWidget(hmUI.widget.FILL_RECT, {
            x: DEVICE_WIDTH - rectSize * 2 - 10,
            y: this.state.y + titleHeight / 2 - rectSize / 2,
            w: rectSize * 2,
            h: rectSize,
            radius: rectSize / 2,
            color: color[0] << 16 | color[1] << 8 | color[2]
        })

        this.state.y += titleHeight + 10
    }
    drawElements() {
        this.state.rendered = false;
        this.clearWidgets()

        if (typeof this.state.item !== 'object') {
            this.drawError("Wrong sensor data " + typeof this.state.item)
            return;
        }

        const titleHeight = 40;
        const valueHeight = 48;

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
        this.state.y += titleHeight

        this.createWidget(hmUI.widget.SLIDE_SWITCH, {
            x: DEVICE_WIDTH / 2 - 76 / 2,
            y: this.state.y,
            w: DEVICE_WIDTH,
            h: valueHeight,
            select_bg: "switch_on.png",
            un_select_bg: "switch_off.png",
            slide_src: "radio_select.png",
            slide_select_x: 32,
            slide_un_select_x: 8,
            checked: this.state.item.state === "on" ? true : false,
            checked_change_func: (slideSwitch, checked) => {
                if (!this.state.rendered) return;
                messageBuilder.request({ method: "TOGGLE_SWITCH", entity_id: this.state.item.key, value: checked, service: this.state.item.type });
                this.state.reloadTimer = timer.createTimer(
                    2000,
                    10000,
                    function (page) {
                        timer.stopTimer(page.state.reloadTimer)
                        page.state.reloadTimer = null
                        page.clearWidgets()
                        page.drawWait()
                        page.getSensorInfo()
                    },
                    this
                )
            },
        });
        this.state.y += valueHeight + 10


        if (typeof this.state.item.attributes.brightness === 'number') {
            this.drawSlider()
        }

        if (this.state.item.attributes.rgb_color) {
            this.drawColorWheel()
        }

        if (this.state.item.attributes.effect) {
            this.createWidget(hmUI.widget.TEXT, {
                x: 10,
                y: this.state.y,
                w: DEVICE_WIDTH / 3,
                h: 32,
                text: "Effect:",
                text_size: 17,
                color: 0xffffff,
                align_h: hmUI.align.LEFT,
            });

            const effectText = this.createWidget(hmUI.widget.TEXT, {
                x: 10 + DEVICE_WIDTH / 3,
                y: this.state.y,
                w: DEVICE_WIDTH / 3 * 2 - 20,
                h: 32,
                text: this.state.item.attributes.effect,
                text_size: 17,
                color: 0xffffff,
                align_h: hmUI.align.RIGHT,
            });

            effectText.addEventListener(hmUI.event.CLICK_DOWN, (info) => {
                // hmApp.gotoPage({ file: `page/light/effectPicker.page`, param: JSON.stringify(this.state.item) })
                this.router.go('light/effect_picker', this.state.item);
            })
        }

        this.state.rendered = true;
    }
    onInit(param) {
        logger.log('onInit')
        logger.log("param", param)
        this.state.item = param;
        this.drawWait()
        this.getSensorInfo()
    }
    onRender() {
        hmUI.setLayerScrolling(true);
    }
    onDestroy() {
        timer.stopTimer(this.state.reloadTimer)
    }
}

export default Index;