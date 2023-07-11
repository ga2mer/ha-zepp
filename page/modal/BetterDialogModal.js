import Modal from "./Modal";
import { DEVICE_HEIGHT, DEVICE_WIDTH, TOP_BOTTOM_OFFSET, BUTTON_COLOR_NORMAL, BUTTON_COLOR_PRESSED } from "../home/index.style";

/**
 * better than stock :-)
 */
const logger = DeviceRuntimeCore.HmLogger.getLogger("ha-zepp-betterdialog");

class BetterDialogModal extends Modal {

    /**
     * 
     * @param {string} title Dialog title
     * @param {string} text Dialog text or null
     * @param {[string]} buttons array of 48px img src (1-3) or null
     * @param {function(buttonIndex)} callback 
     */
    constructor(app, title, text, buttons, callback) {
        super(app);
        this.controls = {
            title: null,
            text: null,
            buttons: []
        }
        this.props = { title, text, buttons }
        this.callback = callback
    }

    onShow() {
        if (this.app.router.isModalShown()) return
        super.onShow()

        var buttonHeight = 0;

        if (this.props.buttons) {
            buttonHeight = 58 * 2
            const buttonMargin = 6
            const buttonWidth = (DEVICE_WIDTH - (buttonMargin * (this.props.buttons.length - 1))) / this.props.buttons.length

            const imgSize = 48

            var nextX = 0
            for (var i = 0; i < this.props.buttons.length; i++) {

                let buttonIndex = i;

                this.controls.buttons.push(hmUI.createWidget(hmUI.widget.BUTTON, {
                    x: nextX,
                    y: DEVICE_HEIGHT - buttonHeight,
                    w: buttonWidth,
                    h: buttonHeight,
                    normal_color: BUTTON_COLOR_NORMAL,
                    press_color: BUTTON_COLOR_PRESSED,
                    click_func: () => {
                        if (!this.app.router.isModalShown())
                            return
                        this.callback(buttonIndex)
                    }
                }))

                let btnImg = hmUI.createWidget(hmUI.widget.IMG, {
                    x: nextX + (buttonWidth / 2) - (imgSize / 2),
                    y: (DEVICE_HEIGHT - buttonHeight) + (buttonHeight / 2) - (imgSize / 2),
                    w: imgSize,
                    h: imgSize,
                    src: this.props.buttons[i]
                })
                btnImg.setEnable(false)
                this.controls.buttons.push(btnImg)

                nextX += buttonWidth

                if (i != (this.props.buttons.length - 1)) {
                    nextX += 5
                }
            }
        }

        const titleHeight = 48;

        this.controls.title = hmUI.createWidget(hmUI.widget.TEXT, {
            x: 0,
            y: TOP_BOTTOM_OFFSET,
            w: DEVICE_WIDTH,
            h: titleHeight * 2,
            color: 0xffffff,
            text_size: 21,
            text: this.props.title
        })

        if (this.props.text) {
            this.controls.text = hmUI.createWidget(hmUI.widget.TEXT, {
                x: 0,
                y: TOP_BOTTOM_OFFSET + (titleHeight * 2) + 20,
                w: DEVICE_WIDTH,
                h: DEVICE_HEIGHT - (TOP_BOTTOM_OFFSET + (titleHeight * 2)) - buttonHeight - 20,
                color: 0xdadada,
                text_size: 19,
                text: this.props.text
            })
        }
    }

    onHide() {
        if (!this.app.router.isModalShown()) return

        for (var i = 0; i < this.controls.buttons.length; i++) {
            hmUI.deleteWidget(this.controls.buttons[i])
        }

        hmUI.deleteWidget(this.controls.text)
        hmUI.deleteWidget(this.controls.title)

        super.onHide()
    }
}

export default BetterDialogModal