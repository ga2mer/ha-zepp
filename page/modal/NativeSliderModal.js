import { DEVICE_HEIGHT, DEVICE_WIDTH, TOP_BOTTOM_OFFSET, BUTTON_COLOR_NORMAL, BUTTON_COLOR_PRESSED } from "../home/index.style";
import Modal from "./Modal";
/**
 * @param {object} props {
 *                          ctx: object,
 *                          onSliderMove: function(ctx,floatpos,isUserInput),
 *                          frontColor: number,
 *                          backColor: number,
 *                          stateImages: array[string]
 *                          button: object, //{ onButtonToggle: function(ctx, boolean), image: string  }
 *                      }
 * @returns {object} {
 *                      onShow(),
 *                      setPosition(floatpos),
 *                      getPosition(),
 *                      setButtonToggle(boolean), // only if button is set in params
 *                      getButtonToggle(boolean), // only if button is set in params
 *                   } 
*/

const logger = DeviceRuntimeCore.HmLogger.getLogger("ha-zepp-nativeslider");

const WIDTH = DEVICE_WIDTH - TOP_BOTTOM_OFFSET * 2;
const POS_X = TOP_BOTTOM_OFFSET;
const POS_Y = TOP_BOTTOM_OFFSET;

const OUTLINE_WIDTH = (WIDTH) / 2;
const BUTTON_SIZE = WIDTH / 3 * 2;
const STATE_IMAGE_SIZE = 72;
const ACTION_IMG_SIZE = 36;

class NativeSliderModal extends Modal {
    constructor(callback, callbackArg, props) {
        super();

        this.callback = callback
        this.callbackArg = callbackArg
        this.props = props
        
        this.height = (DEVICE_HEIGHT - TOP_BOTTOM_OFFSET * (this.props.button ? 4 : 2));

        this.backgroundRectangle = null;
        this.sliderBottom = null;
        this.sliderTop = null;
        this.outlineStroke = null;
        this.actionButton = null;
        this.actionButtonIcon = null;
        this.stateImage = null;

        this.sliderPressed = false;
        this.lastHeight = this.height / 2;
        this.last_y = 0;
        this.buttonState = false;
        this.stateImageIndex = 0;
        this.shown = false;
    }

    getButtonToggle() { return this.buttonState };

    setButtonToggle(value, fromUserInput) {
        if (!this.shown) return
        this.buttonState = value
        this.actionButton.setProperty(hmUI.prop.MORE, {
            x: DEVICE_WIDTH / 2 - BUTTON_SIZE / 2,
            y: POS_Y + this.height + 20,
            w: BUTTON_SIZE,
            h: BUTTON_SIZE,
            normal_color: this.buttonState ? BUTTON_COLOR_PRESSED : BUTTON_COLOR_NORMAL,
            press_color: this.buttonState ? BUTTON_COLOR_PRESSED : BUTTON_COLOR_NORMAL,
        })

        if (fromUserInput)
            this.props.button.onButtonToggle(this.callbackArg, this.buttonState)
    };

    setPosition(floatvalue) {
        if (!this.shown ||this.sliderPressed) return

        let newHeight = Math.round((1 - floatvalue) * this.height)
        newHeight = Math.max(0, newHeight)
        newHeight = Math.min(this.height, newHeight)
        this.lastHeight = newHeight
        this.sliderTop.setProperty(hmUI.prop.MORE,
            {
                x: POS_X,
                y: POS_Y,
                w: WIDTH,
                h: newHeight
            })

        if (this.stateImage) {
            this.stateImageIndex = Math.floor(floatvalue * (this.props.stateImages.length - 1))
            this.stateImage.setProperty(hmUI.prop.MORE, {
                src: this.props.stateImages[this.stateImageIndex]
            })
        }
    };

    getPosition() {
        return (1 - (this.lastHeight / this.height))
    };

    onShow() {
        logger.log("showing")
        this.backgroundRectangle = hmUI.createWidget(hmUI.widget.FILL_RECT, {
            h: DEVICE_HEIGHT,
            w: DEVICE_WIDTH,
            x: 0,
            y: 0,
            color: 0x000000
        })

        this.sliderBottom = hmUI.createWidget(hmUI.widget.FILL_RECT, {
            x: POS_X,
            y: POS_Y,
            w: WIDTH,
            h: this.height,
            radius: 0,
            color: this.props.frontColor
        })

        this.sliderTop = hmUI.createWidget(hmUI.widget.FILL_RECT, {
            x: POS_X,
            y: POS_Y,
            w: WIDTH,
            h: this.height / 2,
            radius: 0,
            color: this.props.backColor
        })
        this.sliderTop.setEnable(false)

        this.outlineStroke = hmUI.createWidget(hmUI.widget.STROKE_RECT, {
            x: POS_X - OUTLINE_WIDTH,
            y: POS_Y - OUTLINE_WIDTH,
            w: WIDTH + 2 * OUTLINE_WIDTH,
            h: this.height + 2 * OUTLINE_WIDTH,
            radius: (WIDTH),
            color: 0x000000,
            line_width: OUTLINE_WIDTH
        })
        this.outlineStroke.setEnable(false)

        if (this.props.stateImages) {
            this.stateImage = hmUI.createWidget(hmUI.widget.IMG,
                {
                    x: DEVICE_WIDTH / 2 - STATE_IMAGE_SIZE / 2,
                    y: POS_Y + this.height - 20 - STATE_IMAGE_SIZE,
                    h: STATE_IMAGE_SIZE,
                    w: STATE_IMAGE_SIZE,
                    src: this.props.stateImages[this.stateImageIndex]
                })
            this.stateImage.setEnable(false)
        }

        this.sliderBottom.addEventListener(hmUI.event.MOVE, (info) => {
            if (!this.sliderPressed || !this.shown) return
            let newHeight = Math.round((info.y - this.last_y) + this.lastHeight)
            newHeight = Math.max(0, newHeight)
            newHeight = Math.min(this.height, newHeight)

            this.sliderTop.setProperty(hmUI.prop.MORE,
                {
                    x: POS_X,
                    y: POS_Y,
                    w: WIDTH,
                    h: newHeight
                })
            this.lastHeight = newHeight
            this.last_y = info.y

            if (this.stateImage) {
                let newStateImageIndex = Math.floor(this.getPosition() * (this.props.stateImages.length - 1))

                if (newStateImageIndex != this.stateImageIndex) {
                    this.stateImageIndex = newStateImageIndex
                    this.stateImage.setProperty(hmUI.prop.MORE, {
                        src: this.props.stateImages[this.stateImageIndex]
                    })
                }
            }
        })

        this.sliderBottom.addEventListener(hmUI.event.CLICK_DOWN, (info) => {
            this.last_y = info.y
            this.sliderPressed = true
        })

        this.sliderBottom.addEventListener(hmUI.event.CLICK_UP, (info) => {
            if (this.sliderPressed) this.callback(this.callbackArg, this.getPosition(), true);
            this.sliderPressed = false
        })

        if (this.props.button) {
            this.actionButton = hmUI.createWidget(hmUI.widget.BUTTON, {
                x: DEVICE_WIDTH / 2 - BUTTON_SIZE / 2,
                y: POS_Y + this.height + 20,
                w: BUTTON_SIZE,
                h: BUTTON_SIZE,
                radius: BUTTON_SIZE / 2,
                normal_color: BUTTON_COLOR_NORMAL,
                press_color: BUTTON_COLOR_NORMAL,
                click_func: () => { this.setButtonToggle(!this.buttonState, true) }
            })

            this.actionButtonIcon = hmUI.createWidget(hmUI.widget.IMG, {
                x: DEVICE_WIDTH / 2 - ACTION_IMG_SIZE / 2,
                y: POS_Y + this.height + 20 + BUTTON_SIZE / 2 - ACTION_IMG_SIZE / 2,
                w: ACTION_IMG_SIZE,
                h: ACTION_IMG_SIZE,
                src: this.props.button.image
            })
            this.actionButtonIcon.setEnable(false)
        }
        this.shown = true;
    }

    onHide() {
        logger.log("hiding")
        this.shown = false;
        hmUI.deleteWidget(this.outlineStroke)
        hmUI.deleteWidget(this.sliderTop)
        hmUI.deleteWidget(this.sliderBottom)

        hmUI.deleteWidget(this.backgroundRectangle)

        if (this.props.stateImages) {
            hmUI.deleteWidget(this.stateImage)
        }

        if (this.props.button) {
            hmUI.deleteWidget(this.actionButton)
            hmUI.deleteWidget(this.actionButtonIcon)
        }
    }
}

export default NativeSliderModal;

    // export const NativeSliderModal = (args) => {
    //     let WIDTH = DEVICE_WIDTH - TOP_BOTTOM_OFFSET * 2
    //     let this.height = (DEVICE_HEIGHT - TOP_BOTTOM_OFFSET * (this.props.button ? 4 : 2))
    //     let POS_X = TOP_BOTTOM_OFFSET
    //     let POS_Y = TOP_BOTTOM_OFFSET

    //     let outlineWidth = (WIDTH) / 2
    //     const BUTTON_SIZE = WIDTH / 3 * 2
    //     const STATE_IMAGE_SIZE = 72
    //     const ACTION_IMG_SIZE = 36

    //     let backgroundRectangle = null
    //     let this.sliderBottom = null
    //     let this.sliderTop = null
    //     let outlineStroke = null
    //     let actionButton = null
    //     let actionButtonIcon = null
    //     let this.stateImage = null

    //     let shown = false;
    //     let this.sliderPressed = false
    //     let this.lastHeight = this.height / 2
    //     let this.buttonState = false
    //     let this.stateImageIndex = 0

    //     const getButtonToggle = () => { return this.buttonState };

    //     const setButtonToggle = (value, fromUserInput) => {
    //         if (!shown) return

    //         this.buttonState = value
    //         actionButton.setProperty(hmUI.prop.MORE, {
    //             x: DEVICE_WIDTH / 2 - BUTTON_SIZE / 2,
    //             y: POS_Y + this.height + 20,
    //             w: BUTTON_SIZE,
    //             h: BUTTON_SIZE,
    //             normal_color: this.buttonState ? BUTTON_COLOR_PRESSED : BUTTON_COLOR_NORMAL,
    //             press_color: this.buttonState ? BUTTON_COLOR_PRESSED : BUTTON_COLOR_NORMAL,
    //         })

    //         if (fromUserInput)
    //             this.props.button.onButtonToggle(this.props.ctx, this.buttonState)
    //     };

    //     const setPosition = (floatvalue) => {
    //         if (!shown || this.sliderPressed) return

    //         let newHeight = Math.round((1 - floatvalue) * this.height)
    //         newHeight = Math.max(0, newHeight)
    //         newHeight = Math.min(this.height, newHeight)
    //         this.lastHeight = newHeight
    //         this.sliderTop.setProperty(hmUI.prop.MORE,
    //             {
    //                 x: POS_X,
    //                 y: POS_Y,
    //                 w: WIDTH,
    //                 h: newHeight
    //             })

    //         if (this.stateImage) {
    //             this.stateImageIndex = Math.floor(floatvalue * (this.props.stateImages.length - 1))
    //             this.stateImage.setProperty(hmUI.prop.MORE, {
    //                 src: this.props.stateImages[this.stateImageIndex]
    //             })
    //         }
    //     };

    //     const getPosition = () => {
    //         return (1 - (this.lastHeight / this.height))
    //     };

    //     const show = () => {
    //         if (shown) return
    //         backgroundRectangle = hmUI.createWidget(hmUI.widget.FILL_RECT, {
    //             h: DEVICE_HEIGHT,
    //             w: DEVICE_WIDTH,
    //             x: 0,
    //             y: 0,
    //             color: 0x000000
    //         })

    //         this.sliderBottom = hmUI.createWidget(hmUI.widget.FILL_RECT, {
    //             x: POS_X,
    //             y: POS_Y,
    //             w: WIDTH,
    //             h: this.height,
    //             radius: 0,
    //             color: this.props.frontColor
    //         })

    //         this.sliderTop = hmUI.createWidget(hmUI.widget.FILL_RECT, {
    //             x: POS_X,
    //             y: POS_Y,
    //             w: WIDTH,
    //             h: this.height / 2,
    //             radius: 0,
    //             color: this.props.backColor
    //         })
    //         this.sliderTop.setEnable(false)

    //         outlineStroke = hmUI.createWidget(hmUI.widget.STROKE_RECT, {
    //             x: POS_X - outlineWidth,
    //             y: POS_Y - outlineWidth,
    //             w: WIDTH + 2 * outlineWidth,
    //             h: this.height + 2 * outlineWidth,
    //             radius: (WIDTH),
    //             color: 0x000000,
    //             line_width: outlineWidth
    //         })
    //         outlineStroke.setEnable(false)

    //         if (this.props.stateImages) {
    //             this.stateImage = hmUI.createWidget(hmUI.widget.IMG,
    //                 {
    //                     x: DEVICE_WIDTH / 2 - STATE_IMAGE_SIZE / 2,
    //                     y: POS_Y + this.height - 20 - STATE_IMAGE_SIZE,
    //                     h: STATE_IMAGE_SIZE,
    //                     w: STATE_IMAGE_SIZE,
    //                     src: this.props.stateImages[this.stateImageIndex]
    //                 })
    //             this.stateImage.setEnable(false)
    //         }

    //         let this.last_y = 0

    //         this.sliderBottom.addEventListener(hmUI.event.MOVE, function (info) {
    //             if (!this.sliderPressed) return
    //             let newHeight = Math.round((info.y - this.last_y) + this.lastHeight)
    //             newHeight = Math.max(0, newHeight)
    //             newHeight = Math.min(this.height, newHeight)

    //             this.sliderTop.setProperty(hmUI.prop.MORE,
    //                 {
    //                     x: POS_X,
    //                     y: POS_Y,
    //                     w: WIDTH,
    //                     h: newHeight
    //                 })
    //             this.lastHeight = newHeight
    //             this.last_y = info.y

    //             if (this.stateImage) {
    //                 let newStateImageIndex = Math.floor((1 - this.lastHeight / this.height) * (this.props.stateImages.length - 1))

    //                 if (newStateImageIndex != this.stateImageIndex) {
    //                     this.stateImageIndex = newStateImageIndex
    //                     this.stateImage.setProperty(hmUI.prop.MORE, {
    //                         src: this.props.stateImages[this.stateImageIndex]
    //                     })
    //                 }
    //             }

    //         })

    //         this.sliderBottom.addEventListener(hmUI.event.CLICK_DOWN, function (info) {
    //             this.last_y = info.y
    //             this.sliderPressed = true
    //         })

    //         this.sliderBottom.addEventListener(hmUI.event.CLICK_UP, function (info) {
    //             if (this.sliderPressed) this.props.onSliderMove(this.props.ctx, (1 - (this.lastHeight / this.height)), true);
    //             this.sliderPressed = false
    //         })

    //         if (this.props.button) {
    //             actionButton = hmUI.createWidget(hmUI.widget.BUTTON, {
    //                 x: DEVICE_WIDTH / 2 - BUTTON_SIZE / 2,
    //                 y: POS_Y + this.height + 20,
    //                 w: BUTTON_SIZE,
    //                 h: BUTTON_SIZE,
    //                 radius: BUTTON_SIZE / 2,
    //                 normal_color: BUTTON_COLOR_NORMAL,
    //                 press_color: BUTTON_COLOR_NORMAL,
    //                 click_func: (button_widget) => { setButtonToggle(!this.buttonState, true) }
    //             })

    //             actionButtonIcon = hmUI.createWidget(hmUI.widget.IMG, {
    //                 x: DEVICE_WIDTH / 2 - ACTION_IMG_SIZE / 2,
    //                 y: POS_Y + this.height + 20 + BUTTON_SIZE / 2 - ACTION_IMG_SIZE / 2,
    //                 w: ACTION_IMG_SIZE,
    //                 h: ACTION_IMG_SIZE,
    //                 src: this.props.button.image
    //             })
    //             actionButtonIcon.setEnable(false)
    //         }

    //         hmApp.registerGestureEvent(function (event) {
    //             if (event == hmApp.gesture.RIGHT) {
    //                 hmUI.deleteWidget(outlineStroke)
    //                 hmUI.deleteWidget(this.sliderTop)
    //                 hmUI.deleteWidget(this.sliderBottom)

    //                 hmUI.deleteWidget(backgroundRectangle)

    //                 if (this.props.stateImages) {
    //                     hmUI.deleteWidget(this.stateImage)
    //                 }

    //                 if (this.props.button) {
    //                     hmUI.deleteWidget(actionButton)
    //                     hmUI.deleteWidget(actionButtonIcon)
    //                 }
    //                 hmUI.redraw();
    //                 hmApp.unregisterGestureEvent();

    //                 shown = false;

    //                 return true
    //             }
    //             return false;
    //         })
    //         shown = true;
    //     }

    //     return { setPosition, getPosition, setButtonToggle, getButtonToggle, show }
    // };