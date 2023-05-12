import { DEVICE_HEIGHT, DEVICE_WIDTH, TOP_BOTTOM_OFFSET } from "../home/index.style";
const { messageBuilder } = getApp()._options.globalData;
const logger = DeviceRuntimeCore.HmLogger.getLogger("ha-zepp-mediaplayer");

const sliderWidth = 150;

Page({
    state: {
        y: TOP_BOTTOM_OFFSET,
        item: null,
        widgets: [],
        rendered: false,
        reloadTimer: null,
        arcUpdateTimer: null,
        sliderPoint: null,
        titleText: null,
        artistText: null,
        positionArc: null,
        playButton: null,
        isPlaying: false
    },
    createWidget(...args) {
        const widget = hmUI.createWidget(...args);
        this.state.widgets.push(widget);
        return widget;
    },
    destroyTimers() {
        if (this.state.arcUpdateTimer) {
            timer.stopTimer(this.state.arcUpdateTimer)
            this.state.arcUpdateTimer = null
        }

        if (this.state.reloadTimer) {
            timer.stopTimer(this.state.reloadTimer)
            this.state.reloadTimer = null
        }
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
                    if (this.state.rendered) {
                        this.clearWidgets();
                    }
                    this.drawError(error);
                    return;
                }
                this.state.item = result;

                if (!this.state.rendered)
                    this.drawElements();
                else
                    this.updateElementsData();
            })
            .catch((res) => {
                this.drawError();
                console.log(res);
            });
    },
    setReloadTimer(delay) {
        if (this.state.reloadTimer)
            timer.stopTimer(this.state.reloadTimer)

        this.state.reloadTimer = timer.createTimer(
            delay,
            10000,
            function (page) {
                page.getSensorInfo()
            },
            this
        )
    },
    setArcUpdateTimer(state) {
        if (state && !this.state.arcUpdateTimer) {
            this.state.arcUpdateTimer = timer.createTimer(
                0,
                1000,
                function (page) {
                    page.state.item.attributes.media_position = Math.min(page.state.item.attributes.media_position + 1, page.state.item.attributes.media_duration)
                    page.setArcPosition(page.state.item.attributes.media_position / page.state.item.attributes.media_duration)

                    if (page.state.item.attributes.media_position == page.state.item.attributes.media_duration) {
                        page.setArcUpdateTimer(false)
                        page.setReloadTimer(1000)
                    }
                },
                this
            )
        }
        if (!state && this.state.arcUpdateTimer) {
            timer.stopTimer(this.state.arcUpdateTimer)
            this.state.arcUpdateTimer = null
        }
    },
    doMediaAction(action) {
        messageBuilder.request({ method: "MEDIA_ACTION", entity_id: this.state.item.key, value: '{}', service: "media_" + action });

        if (action.includes("_track")) {
            this.getSensorInfo(1000)
        }
        else {
            if (this.positionArc)
                this.setArcUpdateTimer(action === "play");
            this.state.isPlaying = action === "play"
        }
    },
    setSliderPos(floatvalue) {
        this.state.sliderPoint.setProperty(hmUI.prop.MORE, { w: floatvalue * sliderWidth + DEVICE_WIDTH / 2 - sliderWidth / 2 });
    },
    setArcPosition(floatvalue) {
        this.state.positionArc.setProperty(hmUI.prop.MORE, { end_angle: Math.min(270, Math.round(floatvalue * 360) - 90) });
    },
    drawSlider() {
        const sliderRowHeight = 12
        const sliderStartX = DEVICE_WIDTH / 2 - sliderWidth / 2
        const sliderStartY = DEVICE_HEIGHT - 120
        const sliderRow = this.createWidget(hmUI.widget.FILL_RECT, {
            x: sliderStartX,
            y: sliderStartY,
            w: sliderWidth,
            h: sliderRowHeight,
            radius: sliderRowHeight / 2,
            color: 0x262626
        })

        this.state.sliderPoint = this.createWidget(hmUI.widget.FILL_RECT, {
            x: sliderStartX,
            y: sliderStartY,
            w: sliderWidth / 2,
            h: sliderRowHeight,
            radius: sliderRowHeight / 2,
            color: 0xffffff
        })
        this.state.y += sliderRowHeight * 2 + 20

        function onSliderMove(info, pageState) {
            let width = info.x - sliderStartX
            width = Math.max(width, 0)
            width = Math.min(width, sliderStartX + sliderWidth)

            const float_pos = (width / sliderWidth).toFixed(2)
            pageState.sliderPoint.setProperty(hmUI.prop.MORE, { w: width })

            if (pageState.rendered)
                messageBuilder.request({ method: "MEDIA_ACTION", entity_id: pageState.item.key, value: `{"volume_level": ${float_pos}}`, service: "volume_set" });
        }

        sliderRow.addEventListener(hmUI.event.CLICK_UP, (x) => { onSliderMove(x, this.state) })
        this.state.sliderPoint.addEventListener(hmUI.event.CLICK_UP, (x) => { onSliderMove(x, this.state) })
    },
    updateElementsData() {
        this.state.isPlaying = this.state.item.state === "playing"

        if (this.state.isPlaying) {
            this.state.playButton.setProperty(hmUI.prop.MORE, {
                src: (this.state.isPlaying ? "pause" : "play") + ".png"
            })
        }

        if (this.state.positionArc) {
            this.setArcPosition(this.state.item.attributes.media_position / this.state.item.attributes.media_duration);
            this.setArcUpdateTimer(this.state.isPlaying)
        }

        if (this.state.titleText)
            this.state.titleText.setProperty(hmUI.prop.TEXT, this.state.item.attributes.media_title);

        if (this.state.artistText)
            this.state.artistText.setProperty(hmUI.prop.TEXT, this.state.item.attributes.media_artist);

        if (typeof this.state.item.attributes.volume_level === 'number')
            this.setSliderPos(this.state.item.attributes.volume_level);

    },
    drawElements() {
        this.state.rendered = false;
        this.clearWidgets()

        if (typeof this.state.item !== 'object') {
            this.drawError("Wrong sensor data " + typeof this.state.item)
            return;
        }

        const seekButtonsHeight = 60

        if (this.state.item.attributes.supported_features & 16) { //PREVIOUS_TRACK  https://github.com/home-assistant/core/blob/e9705364a80fff9c18e2e24b0c0dceff0a71df6e/homeassistant/components/media_player/const.py#L179
            this.createWidget(hmUI.widget.BUTTON, {
                x: 0,
                y: 0,
                w: DEVICE_WIDTH,
                h: seekButtonsHeight,
                normal_src: "skip_previous.png",
                press_src: "skip_previous_pressed.png",
                click_func: () => {
                    this.doMediaAction("previous_track")
                }
            })
        }

        this.state.y = 60 + 10

        const titleHeight = 40;
        const valueHeight = 48;

        this.createWidget(hmUI.widget.TEXT, {
            x: 10,
            y: this.state.y,
            w: DEVICE_WIDTH - 20,
            h: titleHeight,
            text: this.state.item.title,
            text_size: 19,
            color: 0xffffff,
            align_h: hmUI.align.CENTER_H,
        });
        this.state.y += titleHeight + 20


        if (typeof this.state.item.attributes.media_duration === "number" &&
            typeof this.state.item.attributes.media_position === "number") {

            this.createWidget(hmUI.widget.ARC, {
                x: DEVICE_WIDTH / 2 - DEVICE_WIDTH / 4,
                y: this.state.y,
                w: DEVICE_WIDTH / 2,
                h: DEVICE_WIDTH / 2,
                start_angle: 0,
                end_angle: 360,
                color: 0x262626,
                line_width: 7
            })

            this.state.positionArc = this.createWidget(hmUI.widget.ARC, {
                x: DEVICE_WIDTH / 2 - DEVICE_WIDTH / 4,
                y: this.state.y,
                w: DEVICE_WIDTH / 2,
                h: DEVICE_WIDTH / 2,
                start_angle: -90,
                end_angle: 200,
                color: 0xffffff,
                line_width: 7
            })

        }

        const playIconSize = 48
        this.state.playButton = hmUI.createWidget(hmUI.widget.IMG, {
            x: DEVICE_WIDTH / 2 - playIconSize / 2,
            y: this.state.y + DEVICE_WIDTH / 4 - playIconSize / 2,
            src: 'play.png'
        })

        if (this.state.item.attributes.supported_features & 1) { //PAUSE  https://github.com/home-assistant/core/blob/e9705364a80fff9c18e2e24b0c0dceff0a71df6e/homeassistant/components/media_player/const.py#L179
            this.state.playButton.addEventListener(hmUI.event.CLICK_UP, (info) => {
                if (this.state.rendered) {
                    this.doMediaAction((this.state.isPlaying ? "pause" : "play"));
                }

                this.state.playButton.setProperty(hmUI.prop.MORE, {
                    src: (this.state.isPlaying ? "pause" : "play") + ".png"
                })
            })
        }

        this.state.y += DEVICE_WIDTH / 2 + 30


        if (this.state.item.attributes.media_title) {
            this.state.titleText = this.createWidget(hmUI.widget.TEXT, {
                x: 10,
                y: this.state.y,
                w: DEVICE_WIDTH - 20,
                h: 38,
                text: this.state.item.attributes.media_title,
                text_size: 21,
                color: 0xffffff,
                align_h: hmUI.align.CENTER_H,
            });
            this.state.y += 32
        }


        if (this.state.item.attributes.media_artist) {
            this.state.artistText = this.createWidget(hmUI.widget.TEXT, {
                x: 10,
                y: this.state.y,
                w: DEVICE_WIDTH - 20,
                h: 34,
                text: this.state.item.attributes.media_artist,
                text_size: 19,
                color: 0xaaaaaa,
                align_h: hmUI.align.CENTER_H,
            });
            this.state.y += 32
        }

        if (typeof this.state.item.attributes.volume_level === 'number') {
            this.drawSlider()
        }

        if (this.state.item.attributes.supported_features & 32) { //NEXT_TRACK  https://github.com/home-assistant/core/blob/e9705364a80fff9c18e2e24b0c0dceff0a71df6e/homeassistant/components/media_player/const.py#L179
            this.createWidget(hmUI.widget.BUTTON, {
                x: 0,
                y: DEVICE_HEIGHT - seekButtonsHeight,
                w: DEVICE_WIDTH,
                h: seekButtonsHeight,
                normal_src: "skip_next.png",
                press_src: "skip_next_pressed.png",
                click_func: () => {
                    this.doMediaAction("next_track")
                }
            })
        }

        this.updateElementsData()
        this.setReloadTimer(10000)

        this.state.rendered = true;
    },
    onInit(param) {
        logger.log('onInit')
        logger.log("param", param)
        this.state.item = JSON.parse(param)
        messageBuilder.on("call", ({ payload: buf }) => { })
        this.drawWait()
        this.getSensorInfo()
    },
    build() { },
    onDestroy() { this.destroyTimers(); }
});