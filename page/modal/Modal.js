import { DEVICE_HEIGHT, DEVICE_WIDTH } from "../home/index.style";

class Modal {
    /**
     * 
     * @param {App} app 
     */
    constructor(app) {
        this.app = app;
        this.lastLayerScrolling = undefined
        this.backgroundRectangle = null
        this.shown = false
    }

    onShow() {
        this.lastLayerScrolling = this.app.getLayerScrolling()
        this.app.setLayerScrolling(false)

        this.backgroundRectangle = hmUI.createWidget(hmUI.widget.FILL_RECT, {
            h: DEVICE_HEIGHT,
            w: DEVICE_WIDTH,
            x: 0,
            y: 0,
            color: 0x000000
        })
    }

    onHide() {
        this.app.setLayerScrolling(this.lastLayerScrolling)
        hmUI.deleteWidget(this.backgroundRectangle)
    }
}

export default Modal;