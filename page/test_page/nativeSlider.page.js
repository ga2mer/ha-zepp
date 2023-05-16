import { DEVICE_HEIGHT, DEVICE_WIDTH, TOP_BOTTOM_OFFSET } from "../home/index.style";
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
        let width = DEVICE_WIDTH - TOP_BOTTOM_OFFSET * 2
        let height = (DEVICE_HEIGHT - TOP_BOTTOM_OFFSET * 4)
        let pos_x = TOP_BOTTOM_OFFSET
        let pos_y = TOP_BOTTOM_OFFSET
        const sliderBottom = hmUI.createWidget(hmUI.widget.FILL_RECT, {
            x: pos_x,
            y: pos_y,
            w: DEVICE_WIDTH - TOP_BOTTOM_OFFSET * 2,
            h: height,
            radius: 0,
            color: 0xf0f0f0
        })

        const sliderTop = hmUI.createWidget(hmUI.widget.FILL_RECT, {
            x: pos_x,
            y: pos_y,
            w: width,
            h: height / 2,
            radius: 0,
            color: 0x303030
        })
        sliderTop.setEnable(false)

        let lineWidth = ((width)) / 2
        const STROKE_RECT = hmUI.createWidget(hmUI.widget.STROKE_RECT, {
            x: pos_x - lineWidth,
            y: pos_y - lineWidth,
            w: width + 2 * lineWidth,
            h: height + 2 * lineWidth,
            radius: (width),
            color: 0x000000,
            line_width: lineWidth
        })
        STROKE_RECT.setEnable(false)

        let sliderText = hmUI.createWidget(hmUI.widget.TEXT, {
            x: 0,
            y: pos_y + height + 20,
            w: DEVICE_WIDTH,
            h: 40,
            text: "50%",
            text_size: 20,
            color: 0xffffff,
            align_h: hmUI.align.CENTER_H,
        });

        let sliderPressed = false
        let last_y = 0
        let lastHeight = height / 2
        sliderBottom.addEventListener(hmUI.event.MOVE, function (info) {
            if (!sliderPressed) return
            let newHeight = Math.round((info.y - last_y) + lastHeight)
            newHeight = Math.max(0, newHeight)
            newHeight = Math.min(height, newHeight)

            sliderTop.setProperty(hmUI.prop.MORE,
                {
                    x: pos_x,
                    y: pos_y,
                    w: width,
                    h: newHeight
                })
            lastHeight = newHeight
            last_y = info.y
            sliderText.setProperty(hmUI.prop.TEXT, `${100 - Math.round(lastHeight / height * 100)}%`)
        })

        sliderBottom.addEventListener(hmUI.event.CLICK_DOWN, function (info) {
            last_y = info.y
            sliderPressed = true
        })

        sliderBottom.addEventListener(hmUI.event.CLICK_UP, function (info) {
            sliderPressed = false
        })

    },
    onInit() {
        logger.log('onInit')
        this.drawElements()
    },
    build() { hmUI.setLayerScrolling(false); },
    onDestroy() { }
});