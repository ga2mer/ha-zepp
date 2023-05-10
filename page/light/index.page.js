import { DEVICE_HEIGHT, DEVICE_WIDTH, TOP_BOTTOM_OFFSET } from "../home/index.style";
const { messageBuilder } = getApp()._options.globalData;
const logger = DeviceRuntimeCore.HmLogger.getLogger("helloworld-1");

Page({
    state: {
        rendered: false,
        y: TOP_BOTTOM_OFFSET,
        item: null,
        slider: null,
        sliderText: null
    },
    onInit(param) {
        logger.log('onInit')
        logger.log("param", param)
        this.state.item = JSON.parse(param)
        logger.debug("Page for", this.state.item.key)
        messageBuilder.on("call", ({ payload: buf }) => { })
    },
    build() {

        const titleHeight = 40;
        const valueHeight = 48;

        hmUI.createWidget(hmUI.widget.TEXT, {
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

        hmUI.createWidget(hmUI.widget.SLIDE_SWITCH, {
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
                logger.log("checked_change_func", checked)
                messageBuilder.request({ method: "TOGGLE_SWITCH", entity_id: this.state.item.key, value: checked, service: this.state.item.type });
            },
        });
        this.state.y += valueHeight + 10


        /* slider */

        hmUI.createWidget(hmUI.widget.TEXT, {
            x: 10,
            y: this.state.y,
            w: DEVICE_WIDTH - 10,
            h: titleHeight,
            text: "Brightness",
            text_size: 19,
            color: 0xffffff,
            align_h: hmUI.align.LEFT,
        });

        const sliderText = hmUI.createWidget(hmUI.widget.TEXT, {
            x: 10,
            y: this.state.y,
            w: DEVICE_WIDTH - 10,
            h: titleHeight,
            text: "50%",
            text_size: 19,
            color: 0xffffff,
            align_h: hmUI.align.RIGHT,
        });
        this.state.y += titleHeight + 20

        function setSliderPos(percent) {
            sliderPoint.setProperty(hmUI.prop.MORE, { x: percent / 100 * (pos - sliderStartX + sliderRowHeight) })
            sliderText.setProperty(hmUI.prop.MORE, { text: pos_pct.toString() + "%" })
        }
        function onSliderMove(info, pageState) {
            let pos = info.x - sliderRowHeight
            pos = Math.max(pos, sliderStartX - sliderRowHeight)
            pos = Math.min(pos, sliderStartX + sliderWidth - sliderRowHeight)

            const pos_pct = Math.round((pos - sliderStartX + sliderRowHeight) / sliderWidth * 100)
            sliderText.setProperty(hmUI.prop.MORE, { text: pos_pct.toString() + "%" })
            sliderPoint.setProperty(hmUI.prop.MORE, { x: pos })
            if (pageState.rendered)
                messageBuilder.request({ method: "LIGHT_SET", entity_id: pageState.item.key, value: `{"brightness_pct": ${pos_pct}}`, service: pageState.item.type });
        }

        const sliderWidth = 150
        const sliderRowHeight = 12
        const sliderStartX = DEVICE_WIDTH / 2 - sliderWidth / 2
        const sliderRow = hmUI.createWidget(hmUI.widget.FILL_RECT, {
            x: sliderStartX,
            y: this.state.y,
            w: sliderWidth,
            h: sliderRowHeight,
            radius: sliderRowHeight / 2,
            color: 0x696969
        })

        const sliderPoint = hmUI.createWidget(hmUI.widget.FILL_RECT, {
            x: DEVICE_WIDTH / 2 - sliderRowHeight,
            y: this.state.y + sliderRowHeight / 2 - sliderRowHeight,
            w: sliderRowHeight * 2,
            h: sliderRowHeight * 2,
            radius: sliderRowHeight / 2,
            color: 0xfc6950,
        })

        sliderRow.addEventListener(hmUI.event.CLICK_DOWN, (x) => { onSliderMove(x, this.state) })
        sliderPoint.addEventListener(hmUI.event.CLICK_DOWN, (x) => { onSliderMove(x, this.state) })
        /* slider */
        this.state.rendered = true;
    },
    onDestroy() { }
});