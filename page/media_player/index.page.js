import { DEVICE_HEIGHT, DEVICE_WIDTH, TOP_BOTTOM_OFFSET } from "../home/index.style";
const { messageBuilder } = getApp()._options.globalData;
const logger = DeviceRuntimeCore.HmLogger.getLogger("zeppha-mediaplayer");

Page({
    state: {
        y: TOP_BOTTOM_OFFSET,
        item: null,
        widgets: [],
        rendered: false,
        reloadTimer: null
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
    },
    drawSlider() {
        const titleHeight = 32;
        /* brightness slider */
        this.createWidget(hmUI.widget.TEXT, {
            x: 10,
            y: this.state.y,
            w: DEVICE_WIDTH / 3 * 2,
            h: titleHeight,
            text: "Volume",
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


        const sliderWidth = 150
        const sliderRowHeight = 12
        const sliderStartX = DEVICE_WIDTH / 2 - sliderWidth / 2
        const sliderRow = this.createWidget(hmUI.widget.FILL_RECT, {
            x: sliderStartX,
            y: this.state.y,
            w: sliderWidth,
            h: sliderRowHeight,
            radius: sliderRowHeight / 2,
            color: 0x0884d0
        })

        const sliderPoint = this.createWidget(hmUI.widget.FILL_RECT, {
            x: DEVICE_WIDTH / 2 - sliderRowHeight,
            y: this.state.y + sliderRowHeight / 2 - sliderRowHeight,
            w: sliderRowHeight * 2,
            h: sliderRowHeight * 2,
            radius: sliderRowHeight / 2,
            color: 0xffffff
        })
        this.state.y += sliderRowHeight * 2 + 20

        function setSliderPos(floatvalue) {
            sliderPoint.setProperty(hmUI.prop.MORE, { x: floatvalue * sliderWidth + sliderStartX - sliderRowHeight })
            sliderText.setProperty(hmUI.prop.MORE, { text: Math.round(floatvalue * 100).toString() + "%" })
        }
        function onSliderMove(info, pageState) {
            let pos = info.x - sliderRowHeight
            pos = Math.max(pos, sliderStartX - sliderRowHeight)
            pos = Math.min(pos, sliderStartX + sliderWidth - sliderRowHeight)

            const float_pos = (pos - sliderStartX + sliderRowHeight) / sliderWidth
            sliderText.setProperty(hmUI.prop.MORE, { text: Math.round(float_pos * 100).toString() + "%" })
            sliderPoint.setProperty(hmUI.prop.MORE, { x: pos })
            if (pageState.rendered)
                messageBuilder.request({ method: "MEDIA_ACTION", entity_id: pageState.item.key, value: `{"volume_level": ${float_pos}}`, service: "volume_set" });
        }

        sliderRow.addEventListener(hmUI.event.CLICK_DOWN, (x) => { onSliderMove(x, this.state) })
        sliderPoint.addEventListener(hmUI.event.CLICK_DOWN, (x) => { onSliderMove(x, this.state) })

        setSliderPos(this.state.item.attributes.volume_level)
        /* brightness slider */
    },
    drawElements() {
        this.state.rendered = false;
        this.clearWidgets()

        if (typeof this.state.item !== 'object') {
            this.drawError("Wrong sensor data " + typeof this.state.item)
            return;
        }

        const seekButtonsHeight = 60
        this.createWidget(hmUI.widget.BUTTON, {
            x: 0,
            y: 0,
            w: DEVICE_WIDTH,
            h: seekButtonsHeight,
            normal_color: 0xfc6950,
            press_color: 0xfeb4a8,
            text: '<=',
        })

        this.state.y = 60 + 10

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
        this.state.y += titleHeight + 10

        // this.createWidget(hmUI.widget.SLIDE_SWITCH, {
        //     x: DEVICE_WIDTH / 2 - 76 / 2,
        //     y: this.state.y,
        //     w: DEVICE_WIDTH,
        //     h: valueHeight,
        //     select_bg: "switch_on.png",
        //     un_select_bg: "switch_off.png",
        //     slide_src: "radio_select.png",
        //     slide_select_x: 32,
        //     slide_un_select_x: 8,
        //     checked: this.state.item.state === "playing" ? true : false,
        //     checked_change_func: (slideSwitch, checked) => {
        //         if (!this.state.rendered) return;
        //         messageBuilder.request({ method: "MEDIA_ACTION", entity_id: this.state.item.key, value: "{}", service: "media_play_pause" });
        //         this.state.reloadTimer = timer.createTimer(
        //             1000,
        //             10000,
        //             function (page) {
        //                 timer.stopTimer(page.state.reloadTimer)
        //                 page.state.reloadTimer = null
        //                 page.clearWidgets()
        //                 page.drawWait()
        //                 page.getSensorInfo()
        //             },
        //             this
        //         )
        //     },
        // });
        // this.state.y += valueHeight + 10

        const arc = hmUI.createWidget(hmUI.widget.ARC, {
            x: DEVICE_WIDTH / 2 - DEVICE_WIDTH / 4,
            y: this.state.y,
            w: DEVICE_WIDTH / 2,
            h: DEVICE_WIDTH / 2,
            start_angle: 0,
            end_angle: 90,
            color: 0xfc6950,
            line_width: 10
        })

        this.state.y += DEVICE_WIDTH / 2 + 10


        if (typeof this.state.item.attributes.volume_level === 'number') {
            this.drawSlider()
        }


        if (this.state.item.attributes.media_title) {
            this.createWidget(hmUI.widget.TEXT, {
                x: 10,
                y: this.state.y,
                w: DEVICE_WIDTH / 3,
                h: 32,
                text: "Playing:",
                text_size: 17,
                color: 0xffffff,
                align_h: hmUI.align.LEFT,
            });

            this.createWidget(hmUI.widget.TEXT, {
                x: 10 + DEVICE_WIDTH / 3,
                y: this.state.y,
                w: DEVICE_WIDTH / 3 * 2 - 20,
                h: 32,
                text: this.state.item.attributes.media_title,
                text_size: 17,
                color: 0xffffff,
                align_h: hmUI.align.RIGHT,
            });
            this.state.y += 32
        }

        // if (Object.keys(this.state.item.attributes).length === 0) {
        //     this.createWidget(hmUI.widget.TEXT, {
        //         x: 0,
        //         y: this.state.y,
        //         w: DEVICE_WIDTH,
        //         h: DEVICE_HEIGHT - this.state.y,
        //         text: "Nothing here because the light is off",
        //         text_size: 18,
        //         color: 0xffffff,
        //         align_h: hmUI.align.CENTER_H,
        //         align_v: hmUI.align.CENTER_V
        //     });
        // }
        this.createWidget(hmUI.widget.BUTTON, {
            x: 0,
            y: DEVICE_HEIGHT - seekButtonsHeight,
            w: DEVICE_WIDTH,
            h: seekButtonsHeight,
            normal_color: 0xfc6950,
            press_color: 0xfeb4a8,
            text: '=>',
        })

        this.state.rendered = true;
    },
    onInit(param) {
        logger.log('onInit')
        logger.log("param", param)
        this.state.item = JSON.parse(param)
        logger.debug("Page for", this.state.item.key)
        messageBuilder.on("call", ({ payload: buf }) => { })
        this.drawWait()
        this.getSensorInfo()
    },
    build() {
        hmUI.setLayerScrolling(true);
    },
    onDestroy() { }
});