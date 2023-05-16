import { DEVICE_HEIGHT, DEVICE_WIDTH, TOP_BOTTOM_OFFSET } from "../page/home/index.style";

/**
 * @param {object} args {
 *                          ctx: object,
 *                          onSliderMove: function(ctx,floatpos,isUserInput),
 *                          frontColor: number,
 *                          backColor: number,
 *                      }
 * @returns {object} {
 *                      show(),
 *                      setPosition(floatpos),
 *                      getPosition(),
 *                      components: array[Widget],
 *                   } 
 */
export const nativeSlider = (args) => {
    let width = DEVICE_WIDTH - TOP_BOTTOM_OFFSET * 2
    let height = (DEVICE_HEIGHT - TOP_BOTTOM_OFFSET * 4)
    let pos_x = TOP_BOTTOM_OFFSET
    let pos_y = TOP_BOTTOM_OFFSET

    const backgroundRectangle = hmUI.createWidget(hmUI.widget.FILL_RECT, {
        h: DEVICE_HEIGHT,
        w: DEVICE_WIDTH,
        x: 0,
        y: 0,
        color: 0x000000
    })

    const sliderBottom = hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: pos_x,
        y: pos_y,
        w: DEVICE_WIDTH - TOP_BOTTOM_OFFSET * 2,
        h: height,
        radius: 0,
        color: args.frontColor
    })

    const sliderTop = hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: pos_x,
        y: pos_y,
        w: width,
        h: height / 2,
        radius: 0,
        color: args.backColor
    })
    sliderTop.setEnable(false)

    let lineWidth = (width) / 2
    const outlineStroke = hmUI.createWidget(hmUI.widget.STROKE_RECT, {
        x: pos_x - lineWidth,
        y: pos_y - lineWidth,
        w: width + 2 * lineWidth,
        h: height + 2 * lineWidth,
        radius: (width),
        color: 0x000000,
        line_width: lineWidth
    })
    outlineStroke.setEnable(false)

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
        if (sliderPressed) args.onSliderMove(args.ctx, (1 - (lastHeight / height)), true);
        sliderPressed = false
    })

    hmApp.registerGestureEvent(function (event) {
        if (event == hmApp.gesture.RIGHT) {
            hmUI.deleteWidget(sliderText)
            hmUI.deleteWidget(outlineStroke)
            hmUI.deleteWidget(sliderTop)
            hmUI.deleteWidget(sliderBottom)

            hmUI.deleteWidget(backgroundRectangle)
            hmUI.redraw();
            hmApp.unregisterGestureEvent()
            return true
        }
        return false;
    })

    const setPosition = (floatvalue) => {
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

        sliderText.setProperty(hmUI.prop.TEXT, `${Math.round(floatvalue * 100)}%`)

    };

    const getPosition = () => {
        return (1 - (lastHeight / height))
    };

    return { setPosition, getPosition }
};