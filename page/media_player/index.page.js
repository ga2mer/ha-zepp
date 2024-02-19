import { DEVICE_HEIGHT, DEVICE_WIDTH, TOP_BOTTOM_OFFSET } from "../home/index.style";
import { nativeSlider } from "../../controls/nativeSlider";
import { createProgressBar } from "../../controls/progressBar";
const { messageBuilder } = getApp()._options.globalData;
const logger = DeviceRuntimeCore.HmLogger.getLogger("ha-zepp-mediaplayer");

// const sliderWidth = 150;

Page({
    state: {
        y: TOP_BOTTOM_OFFSET,
        item: null,
        widgets: [],
        rendered: false,
        reloadTimer: null,
        arcUpdateTimer: null,
        volumeBar: null,
        titleText: null,
        artistText: null,
        positionArc: null,
        playButton: null,
        powerButton: null,
        nativeslider: null,
        isPlaying: false
    },
    createWidget(...args) {
        const widget = hmUI.createWidget(...args);
        this.state.widgets.push(widget);
        return widget;
    },
    addWidgets(widgets) {
        this.state.widgets.push(...widgets);
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
        this.destroyTimers()
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
        const pageUpdatePeriod = 10000
        if (this.state.reloadTimer)
            timer.stopTimer(this.state.reloadTimer)

        this.state.reloadTimer = timer.createTimer(
            delay,
            pageUpdatePeriod,
            function (page) {
                page.getEntityInfo()
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
        messageBuilder.request({ method: "MEDIA_ACTION", entity_id: this.state.item.key, value: '{}', service: action });

        if (action.includes("_track")) {
            this.getEntityInfo(1000)
        }
        else {
            if (this.positionArc)
                this.setArcUpdateTimer(action === "play");
            this.state.isPlaying = action === "play"
        }
    },
    setArcPosition(floatvalue) {
        this.state.positionArc.setProperty(hmUI.prop.MORE, { end_angle: Math.min(270, Math.round(floatvalue * 360) - 90) });
    },
    updateElementsData() {
        this.state.isPlaying = this.state.item.state === "playing"

        this.state.playButton.setProperty(hmUI.prop.MORE, {
            src: (this.state.isPlaying ? "pause" : "play") + ".png"
        })

        if (this.state.positionArc) {
            this.setArcPosition(this.state.item.attributes.media_position / this.state.item.attributes.media_duration);
            this.setArcUpdateTimer(this.state.isPlaying)
        }

        if (this.state.titleText)
            this.state.titleText.setProperty(hmUI.prop.TEXT, this.state.item.attributes.media_title);

        if (this.state.artistText)
            this.state.artistText.setProperty(hmUI.prop.TEXT, this.state.item.attributes.media_artist);

        if (typeof this.state.item.attributes.is_volume_muted === "boolean")
            this.state.nativeSlider.setButtonToggle(this.state.item.attributes.is_volume_muted);

        if (typeof this.state.item.attributes.volume_level === "number") {
            this.state.volumeBar.setPosition(this.state.item.attributes.volume_level);
            this.state.nativeSlider.setPosition(this.state.item.attributes.volume_level);
        }

    },
    drawElements() {
        this.state.rendered = false;
        this.clearWidgets()

        if (typeof this.state.item !== 'object') {
            this.drawError("Wrong entity data " + typeof this.state.item)
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
                    this.doMediaAction("media_previous_track")
                }
            })
        }

        this.state.y = 60 + 10

        const titleHeight = 30;
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


        if (this.state.item.attributes.media_duration &&
            this.state.item.attributes.media_position) {

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

        let powerToggleSupported = false
        // Only draw power button if media_player supports TURN_ON and TURN_OFF
        if (this.state.item.attributes.supported_features & 128 
            && this.state.item.attributes.supported_features & 256) {
            powerToggleSupported = true
            const powerIconHeight = 48
            const powerIconWidth = 96
            this.state.powerButton = this.createWidget(hmUI.widget.BUTTON, {
                x: DEVICE_WIDTH - powerIconWidth,
                y: this.state.y + DEVICE_WIDTH / 4 - powerIconHeight / 2,
                w: powerIconWidth,
                h: powerIconHeight,
                normal_src: "power.png",
                press_src: "power_pressed.png",
                click_func: () => {
                    this.doMediaAction("toggle")
                    if(this.state.item.state === "off") {
                        this.state.rendered = false
                    }
                }
            })
        }

        const playIconSize = 48
        const xLocation = powerToggleSupported ? (DEVICE_WIDTH / 4 - playIconSize / 2) : DEVICE_WIDTH / 2 - playIconSize / 2
        this.state.playButton = this.createWidget(hmUI.widget.IMG, {
            x: xLocation,
            y: this.state.y + DEVICE_WIDTH / 4 - playIconSize / 2,
            src: 'play.png'
        })

        if (this.state.item.attributes.supported_features & 1) { //PAUSE  https://github.com/home-assistant/core/blob/e9705364a80fff9c18e2e24b0c0dceff0a71df6e/homeassistant/components/media_player/const.py#L179
            this.state.playButton.addEventListener(hmUI.event.CLICK_UP, (info) => {
                if (this.state.rendered) {
                    this.doMediaAction((this.state.isPlaying ? "media_pause" : "media_play"));
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

        if (typeof this.state.item.attributes.volume_level === "number") {
            let nativeSliderButton = null;

            if (typeof this.state.item.attributes.is_volume_muted === "boolean") {
                nativeSliderButton = {
                    image: "volume_off.png",
                    onButtonToggle: (ctx, newValue) => {
                        logger.log("nativeSlider button", newValue);

                        messageBuilder.request(
                            {
                                method: "MEDIA_ACTION",
                                entity_id: ctx.state.item.key,
                                value: `{"is_volume_muted": ${newValue}}`,
                                service: "volume_mute"
                            });
                    }
                }
            }

            this.state.nativeSlider = nativeSlider({
                ctx: this,
                onSliderMove: (ctx, floatpos, isUserInput) => {
                    logger.log("nativeslider input", floatpos)

                    if (ctx.state.rendered && isUserInput) {
                        messageBuilder.request(
                            {
                                method: "MEDIA_ACTION",
                                entity_id: ctx.state.item.key,
                                value: `{"volume_level": ${floatpos}}`,
                                service: "volume_set"
                            });
                        ctx.state.volumeBar.setPosition(floatpos);
                    }
                },
                stateImages: ["volume_min_1.png", "volume_min_2.png", "volume_mid.png", "volume_mid.png", "volume_max.png", "volume_max.png"],
                button: nativeSliderButton,
                backColor: 0x303030,
                frontColor: 0xf0f0f0
            })

            this.state.volumeBar = createProgressBar(
                {
                    x: 10,
                    y: DEVICE_HEIGHT / 2 + 40,
                    h: 24,
                    w: DEVICE_WIDTH - 20,
                    backColor: 0x262626,
                    frontColor: 0xffffff,
                    src: "volume_up.png",
                    ctx: this,
                    onClick: (ctx) => {
                        if (!ctx.state.rendered) return
                        ctx.state.nativeSlider.show()
                        ctx.state.nativeSlider.setPosition(ctx.state.item.attributes.volume_level)
                        ctx.state.nativeSlider.setButtonToggle(ctx.state.item.attributes.is_volume_muted)
                    },
                })
            this.state.y += 12 * 2 + 20
            this.addWidgets(this.state.volumeBar.components)

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
                    this.doMediaAction("media_next_track")
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
        this.drawWait()
        this.getEntityInfo()
    },
    build() { 
        hmUI.setLayerScrolling(false); 
    },
    onDestroy() { 
        hmUI.setStatusBarVisible(false);
        this.destroyTimers(); 
    }
});