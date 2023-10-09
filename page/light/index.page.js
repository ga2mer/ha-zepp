import { DEVICE_HEIGHT, DEVICE_WIDTH, TOP_BOTTOM_OFFSET } from "../home/index.style";
import { createProgressBar } from "../../controls/progressBar";
import { nativeSlider } from "../../controls/nativeSlider";
const { messageBuilder } = getApp()._options.globalData;
const logger = DeviceRuntimeCore.HmLogger.getLogger("ha-zepp-light");

Page({
    state: {
        y: TOP_BOTTOM_OFFSET,
        item: null,
        widgets: [],
        nativeSlider: null,
        brightnessBar: null,
        sliderText: null,
        rendered: false,
        reloadTimer: null
    },
    addWidgets(widgets) {
        this.state.widgets.push(...widgets);
    },
    createWidget(...args) {
        const widget = hmUI.createWidget(...args);
        this.state.widgets.push(widget);
        return widget;
    },
    clearWidgets() {
        this.state.widgets.forEach((widget, index) => {
            hmUI.deleteWidget(widget);
        });
        this.state.widgets = [];
        this.state.rendered = false;
        this.state.y = TOP_BOTTOM_OFFSET; // start from this y to skip rounded border
        hmUI.redraw();
    },
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
        return;
    },
    drawWait() {
        return this.drawTextMessage(`Loading...\n${this.state.item.title}`);
    },
    drawError(message) {
        let text = "An error occurred";
        if (typeof message === 'string') {
            text += ':\n';
            text += message;
        }
        return this.drawTextMessage(text);
    },
    getEntityInfo() {
        messageBuilder
            .request({ method: "GET_ENTITY", entity_id: this.state.item.key })
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
    },
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

        this.state.sliderText = this.createWidget(hmUI.widget.TEXT, {
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

        this.state.nativeSlider = nativeSlider({
            ctx: this,
            onSliderMove: (ctx, floatpos, isUserInput) => {
                logger.log("nativeslider input", floatpos)

                value_pct = Math.round(floatpos * 100)
                ctx.state.sliderText.setProperty(hmUI.prop.MORE, { text: value_pct.toString() + "%" })
                ctx.state.brightnessBar.setPosition(floatpos);
                if (ctx.state.rendered && isUserInput)
                    messageBuilder.request(
                        {
                            method: "LIGHT_SET",
                            entity_id: ctx.state.item.key,
                            value: `{"brightness_pct": ${value_pct}}`,
                            service: ctx.state.item.type
                        });
            },
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

                    ctx.state.nativeSlider.show()
                    ctx.state.nativeSlider.setPosition(this.state.item.attributes.brightness / 100)
                }
            })
        this.state.y += 24 + 20

        this.state.brightnessBar.setPosition(this.state.item.attributes.brightness / 100)

        this.addWidgets(this.state.brightnessBar.components)
    },
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
    },
    drawElements() {
        this.state.rendered = false;
        this.clearWidgets()

        if (typeof this.state.item !== 'object') {
            this.drawError("Wrong entity data " + typeof this.state.item)
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
                        page.getEntityInfo()
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
                hmApp.gotoPage({ file: `page/light/effectPicker.page`, param: JSON.stringify(this.state.item) })
            })
        }

        if (Object.keys(this.state.item.attributes).length === 0) {
            this.createWidget(hmUI.widget.TEXT, {
                x: 0,
                y: this.state.y,
                w: DEVICE_WIDTH,
                h: DEVICE_HEIGHT - this.state.y,
                text: "Nothing here because the light is off",
                text_size: 18,
                color: 0xffffff,
                align_h: hmUI.align.CENTER_H,
                align_v: hmUI.align.CENTER_V
            });
        }

        this.state.rendered = true;
    },
    onDataSave() {

    },
    onInit(param) {
        logger.log('onInit')

        this.state.item = JSON.parse(param)
        this.drawWait()
        this.getEntityInfo()
    },
    build() {
        hmUI.setLayerScrolling(false);
    },
    onDestroy() { }
});