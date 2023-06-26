import AppPage from '../Page';

import { DEVICE_WIDTH } from "../home/index.style";
import { createSlider } from "../../controls/slider";
import { createProgressBar } from '../../controls/progressBar';
import NativeSliderModal from '../modal/NativeSliderModal';
import { rgbColorPack, shadeRGBColor } from '../../utils';
const { messageBuilder } = getApp()._options.globalData;
const logger = DeviceRuntimeCore.HmLogger.getLogger("ha-zepp-light");

class Index extends AppPage {
    constructor(...props) {
        super(...props);
        this.state.item = null;
        this.state.reloadTimer = null;
        this.state.rendered = false;
        this.state.brightnessText = null;
        this.state.brightnessBar = null;
        this.state.brightnessModal = null;
    }
    addWidgets(widgets) {
        this.app.widgets.push(...widgets);
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

        this.state.brightnessText = this.createWidget(hmUI.widget.TEXT, {
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

        let onSliderMove = (ctx, floatpos, isUserInput) => {
            logger.log("nativeslider input", floatpos)

            let value_pct = Math.round(floatpos * 100)
            this.state.item.attributes.brightness = value_pct
            ctx.state.brightnessText.setProperty(hmUI.prop.MORE, { text: value_pct.toString() + "%" })
            ctx.state.brightnessBar.setPosition(floatpos);
            if (ctx.state.rendered && isUserInput)
                messageBuilder.request(
                    {
                        method: "LIGHT_SET",
                        entity_id: ctx.state.item.key,
                        value: `{"brightness_pct": ${value_pct}}`,
                        service: ctx.state.item.type
                    });
        };

        this.state.brightnessModal = new NativeSliderModal(onSliderMove, this,
            {
                stateImages: ["brightness_min_1.png", "brightness_min_2.png", "brightness_mid.png", "brightness_mid.png", "brightness_max.png", "brightness_max.png"],
                backColor: 0x303030,
                frontColor: 0xf0f0f0
            })

        this.state.brightnessBar = createProgressBar(
            {
                x: 10,
                y: this.state.y,
                h: 24,
                w: DEVICE_WIDTH - 20,
                backColor: 0x262626,
                frontColor: 0xffffff,
                src: "brightness_up.png",
                ctx: this,
                onClick: (ctx) => {
                    if (!ctx.state.rendered) return
                    ctx.router.showModal(ctx.state.brightnessModal)
                    ctx.state.brightnessModal.setPosition(this.state.item.attributes.brightness / 100)
                }
            })
        this.state.y += 24 + 20

        this.state.brightnessBar.setPosition(this.state.item.attributes.brightness / 100)
        this.state.brightnessText.setProperty(hmUI.prop.MORE, { text: this.state.item.attributes.brightness + "%" })

        this.addWidgets(this.state.brightnessBar.components)
    }
    drawColorGroup() {
        const titleHeight = 32;
        const rectSize = 24
        this.createWidget(hmUI.widget.TEXT, {
            x: 10,
            y: this.state.y,
            w: DEVICE_WIDTH / 3,
            h: titleHeight,
            text: "Color:",
            text_size: 17,
            color: 0xffffff,
            align_h: hmUI.align.LEFT,
        });
        const color = this.state.item.attributes.rgb_color
        this.createWidget(hmUI.widget.BUTTON, {
            x: 10 + DEVICE_WIDTH / 3,
            y: this.state.y + titleHeight / 2 - rectSize / 2,
            w: DEVICE_WIDTH / 3 * 2 - 20,
            h: rectSize,
            radius: rectSize / 2,
            normal_color: rgbColorPack(color),
            press_color: rgbColorPack(shadeRGBColor(color, -0.3)),
            click_func: () => {
                this.router.go('light/color_picker', this.state.item);
            }
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
                        page.drawWait(this.state.item.title)
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
            this.drawColorGroup()
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

            this.createWidget(hmUI.widget.BUTTON, {
                x: 10 + DEVICE_WIDTH / 3,
                y: this.state.y,
                w: DEVICE_WIDTH / 3 * 2 - 20,
                h: 32,
                text: this.state.item.attributes.effect,
                text_size: 17,
                color: 0xffffff,
                align_h: hmUI.align.RIGHT,
                radius: 16,
                normal_color: 0x101010,
                press_color: 0x262626,
                click_func: () => {
                    this.router.go('light/effect_picker', this.state.item);
                }
            });
        }

        this.state.rendered = true;
    }
    onInit(param) {
        logger.log('onInit')
        logger.log("param", param)
        this.state.item = param;
    }
    onRender() {
        hmUI.setLayerScrolling(false);
        this.drawWait()
        this.getSensorInfo()
    }
    onDestroy() {
        timer.stopTimer(this.state.reloadTimer)
    }
}

export default Index;