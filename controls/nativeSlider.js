import { DEVICE_HEIGHT, DEVICE_WIDTH, TOP_BOTTOM_OFFSET, BUTTON_COLOR_NORMAL, BUTTON_COLOR_PRESSED } from "../page/home/index.style";

/**
 * @param {object} args {
 *                          ctx: object,
 *                          onSliderMove: function(ctx,floatpos,isUserInput),
 *                          frontColor: number,
 *                          backColor: number,
 *                          stateImages: array[string]
 *                          button: object, //{ onButtonToggle: function(ctx, boolean), image: string  }
 *                          Image MUST be
 *                      }
 * @returns {object} {
 *                      show(),
 *                      setPosition(floatpos),
 *                      getPosition(),
 *                      setButtonToggle(boolean), // only if button is set in params
 *                      getButtonToggle(boolean), // only if button is set in params
 *                   } 
 */
export const nativeSlider = (args) => {
    let width = DEVICE_WIDTH - TOP_BOTTOM_OFFSET * 2
    let height = (DEVICE_HEIGHT - TOP_BOTTOM_OFFSET * (args.button ? 4 : 2))
    let pos_x = TOP_BOTTOM_OFFSET
    let pos_y = TOP_BOTTOM_OFFSET

    let outlineWidth = (width) / 2
    const buttonSize = width / 3 * 2
    const stateImageSize = 72
    const actionImgSize = 36
    
    let backgroundRectangle = null
    let sliderBottom = null
    let sliderTop = null
    let outlineStroke = null
    let actionButton = null
    let actionButtonIcon = null
    let stateImage = null
    
    let shown = false;
    let sliderPressed = false
    let lastHeight = height / 2
    let buttonState = false
    let stateImageIndex = 0

    const getButtonToggle = () => { return buttonState };

    const setButtonToggle = (value, fromUserInput) => {
        if (!shown) return

        buttonState = value
        actionButton.setProperty(hmUI.prop.MORE, {
            x: DEVICE_WIDTH / 2 - buttonSize / 2,
            y: pos_y + height + 20,
            w: buttonSize,
            h: buttonSize,
            normal_color: buttonState ? BUTTON_COLOR_PRESSED : BUTTON_COLOR_NORMAL,
            press_color: buttonState ? BUTTON_COLOR_PRESSED : BUTTON_COLOR_NORMAL,
        })

        if (fromUserInput)
            args.button.onButtonToggle(args.ctx, buttonState)
    };

    const setPosition = (floatvalue) => {
        if (!shown || sliderPressed) return
        
        let newHeight = Math.round((1 - floatvalue) * height)
        newHeight = Math.max(0, newHeight)
        newHeight = Math.min(height, newHeight)
        lastHeight = newHeight
        sliderTop.setProperty(hmUI.prop.MORE,
            {
                x: pos_x,
                y: pos_y,
                w: width,
                h: newHeight
            })

        if (stateImage) {
            stateImageIndex = Math.floor(floatvalue * (args.stateImages.length - 1))
            stateImage.setProperty(hmUI.prop.MORE, {
                src: args.stateImages[stateImageIndex]
            })
        }
    };

    const getPosition = () => {
        return (1 - (lastHeight / height))
    };

    const show = () => {
        if (shown) return
        backgroundRectangle = hmUI.createWidget(hmUI.widget.FILL_RECT, {
            h: DEVICE_HEIGHT,
            w: DEVICE_WIDTH,
            x: 0,
            y: 0,
            color: 0x000000
        })

        sliderBottom = hmUI.createWidget(hmUI.widget.FILL_RECT, {
            x: pos_x,
            y: pos_y,
            w: width,
            h: height,
            radius: 0,
            color: args.frontColor
        })

        sliderTop = hmUI.createWidget(hmUI.widget.FILL_RECT, {
            x: pos_x,
            y: pos_y,
            w: width,
            h: height / 2,
            radius: 0,
            color: args.backColor
        })
        sliderTop.setEnable(false)

        outlineStroke = hmUI.createWidget(hmUI.widget.STROKE_RECT, {
            x: pos_x - outlineWidth,
            y: pos_y - outlineWidth,
            w: width + 2 * outlineWidth,
            h: height + 2 * outlineWidth,
            radius: (width),
            color: 0x000000,
            line_width: outlineWidth
        })
        outlineStroke.setEnable(false)

        if (args.stateImages) {
            stateImage = hmUI.createWidget(hmUI.widget.IMG,
                {
                    x: DEVICE_WIDTH / 2 - stateImageSize / 2,
                    y: pos_y + height - 20 - stateImageSize,
                    h: stateImageSize,
                    w: stateImageSize,
                    src: args.stateImages[stateImageIndex]
                })
            stateImage.setEnable(false)
        }

        let last_y = 0

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

            if (stateImage) {
                let newStateImageIndex = Math.floor((1 - lastHeight / height) * (args.stateImages.length - 1))

                if (newStateImageIndex != stateImageIndex) {
                    stateImageIndex = newStateImageIndex
                    stateImage.setProperty(hmUI.prop.MORE, {
                        src: args.stateImages[stateImageIndex]
                    })
                }
            }

        })

        sliderBottom.addEventListener(hmUI.event.CLICK_DOWN, function (info) {
            last_y = info.y
            sliderPressed = true
        })

        sliderBottom.addEventListener(hmUI.event.CLICK_UP, function (info) {
            if (sliderPressed) args.onSliderMove(args.ctx, (1 - (lastHeight / height)), true);
            sliderPressed = false
        })

        if (args.button) {
            actionButton = hmUI.createWidget(hmUI.widget.BUTTON, {
                x: DEVICE_WIDTH / 2 - buttonSize / 2,
                y: pos_y + height + 20,
                w: buttonSize,
                h: buttonSize,
                radius: buttonSize / 2,
                normal_color: BUTTON_COLOR_NORMAL,
                press_color: BUTTON_COLOR_NORMAL,
                click_func: (button_widget) => { setButtonToggle(!buttonState, true) }
            })

            actionButtonIcon = hmUI.createWidget(hmUI.widget.IMG, {
                x: DEVICE_WIDTH / 2 - actionImgSize / 2,
                y: pos_y + height + 20 + buttonSize / 2 - actionImgSize / 2,
                w: actionImgSize,
                h: actionImgSize,
                src: args.button.image
            })
            actionButtonIcon.setEnable(false)
        }

        hmApp.registerGestureEvent(function (event) {
            if (event == hmApp.gesture.RIGHT) {
                hmUI.deleteWidget(outlineStroke)
                hmUI.deleteWidget(sliderTop)
                hmUI.deleteWidget(sliderBottom)

                hmUI.deleteWidget(backgroundRectangle)

                if (args.stateImages) {
                    hmUI.deleteWidget(stateImage)
                }

                if (args.button) {
                    hmUI.deleteWidget(actionButton)
                    hmUI.deleteWidget(actionButtonIcon)
                }
                hmUI.redraw();
                hmApp.unregisterGestureEvent();

                shown = false;

                return true
            }
            return false;
        })
        shown = true;
    }

    return { setPosition, getPosition, setButtonToggle, getButtonToggle, show }
};