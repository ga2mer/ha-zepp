import { DEVICE_HEIGHT, DEVICE_WIDTH, TOP_BOTTOM_OFFSET } from "../home/index.style";
import { createSlider } from "../../controls/slider";
import { nativeSlider } from "../../controls/nativeSlider";
const { messageBuilder } = getApp()._options.globalData;
const logger = DeviceRuntimeCore.HmLogger.getLogger("ha-zepp-testpage");

Page({
    state: {
        y: TOP_BOTTOM_OFFSET,
        widgets: [],
        rendered: false
    },
    createWidget(...args) {
        const widget = hmUI.createWidget(...args);
        this.state.widgets.push(widget);
        return widget;
    },
    addWidget(widget) {
        this.state.widgets.push(widget);
    },
    destroyTimers() {
    },
    clearWidgets() {
        this.state.widgets.forEach((widget, index) => {
            hmUI.deleteWidget(widget);
        });
        this.state.widgets = [];
        this.state.rendered = false;
        this.state.y = TOP_BOTTOM_OFFSET; // start from this y to skip rounded border
        // hmUI.redraw();
    },
    drawSlider() {
        const titleHeight = 32;
        /* brightness slider */
        this.createWidget(hmUI.widget.TEXT, {
            x: 10,
            y: this.state.y,
            w: DEVICE_WIDTH / 3 * 2,
            h: titleHeight,
            text: "Value",
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
                h: 12,
                w: 150,
                x: DEVICE_WIDTH / 2 - 150 / 2,
                y: this.state.y,
                backColor: 0x0884d0,
                frontColor: 0xffffff,
                hasPoint: true,
                ctx: this,
                onSliderMove: (ctx, floatvalue, isUserInput) => {
                    floatvalue = Math.round(floatvalue * 100)
                    sliderText.setProperty(hmUI.prop.MORE, { text: floatvalue.toString() + "%" })
                    if (ctx.state.rendered && isUserInput)
                        console.log("userinput", floatvalue)
                }
            })
        this.state.y += 12 * 2 + 20

        brightnessSlider.setPosition(0.5)

        this.addWidget(brightnessSlider.components)
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
    drawError(message) {
        let text = "An error occurred";
        if (typeof message === 'string') {
            text += ':\n';
            text += message;
        }
        return this.drawTextMessage(text);
    },
    drawElements() {
        this.state.rendered = false;
        this.clearWidgets()

        this.drawSlider()

        const volumeSlider = createSlider(
            {
                h: 12,
                w: 150,
                x: DEVICE_WIDTH / 2 - 150 / 2,
                y: this.state.y,
                backColor: 0x262626,
                frontColor: 0xffffff,
                hasPoint: false,
                ctx: this,
                onSliderMove: (ctx, floatvalue, isUserInput) => {
                    if (ctx.state.rendered && isUserInput)
                        console.log("userinput", floatvalue)
                }
            })
        this.state.y += 12 * 2 + 20
        this.addWidget(volumeSlider.components)

        const buttonSlider = createSlider(
            {
                h: 24,
                w: 150,
                x: DEVICE_WIDTH / 2 - 150 / 2,
                y: this.state.y,
                backColor: 0x262626,
                frontColor: 0xffffff,
                hasPoint: false,
                buttons: { img_down: "brightness_down.png", img_up: "brightness_up.png", change_amt: 0.1 },
                ctx: this,
                onSliderMove: (ctx, floatvalue, isUserInput) => {
                    if (ctx.state.rendered && isUserInput)
                        console.log("userinput", floatvalue)
                }
            })
        this.state.y += 12 * 2 + 20
        this.addWidget(buttonSlider.components)

        const nativeslider = nativeSlider({
            ctx: this,
            onSliderMove: (ctx, floatpos, isUserInput) => {
                console.log("nativeslider input", floatpos)
            },
            stateImages: ["volume_min_1.png", "volume_min_2.png", "volume_mid.png", "volume_mid.png", "volume_max.png", "volume_max.png"],
            button: {
                onButtonToggle: (ctx, newValue) => { console.log("nativeSlider button", newValue) },
                image: "volume_off.png"
            },
            backColor: 0x303030,
            frontColor: 0xf0f0f0
        })

        this.createWidget(hmUI.widget.BUTTON, {
            x: 0,
            y: this.state.y,
            w: DEVICE_WIDTH,
            h: TOP_BOTTOM_OFFSET,
            text: "Native slider",
            click_func: () => {
                nativeslider.show()
                nativeslider.setPosition(0.23)
            }
        });

        this.state.rendered = true;
    },
    onInit() {
        logger.log('onInit')
        hmUI.setLayerScrolling(false);
        this.drawElements()
    },
    build() { },
    onDestroy() { }
});