/**
 * @param {object} args {
 *                          h: number, //height of thickest part or height of image
 *                          w: number,
 *                          x: number,
 *                          y: number,
 *                          hasPoint: boolean,
 *                          buttons: object, //{img_down: "minus_image.png", img_up: "plus_image.png", change_amt: 0.5}
 *                          ctx: object,
 *                          onSliderMove: function(ctx,floatpos,isUserInput),
 *                          frontColor: number,
 *                          backColor: number,
 *                      }
 * @returns {object} {
 *                      setPosition(floatpos),
 *                      getPosition(),
 *                      components: array[Widget],
 *                   } 
 */
export const createSlider = (args) => {
    let downButton = null;
    let upButton = null;

    if (args.buttons) {
        downButton = hmUI.createWidget(hmUI.widget.IMG, {
            x: args.x,
            y: args.y,
            w: args.h,
            h: args.h,
            src: args.buttons.img_down
        })

        upButton = hmUI.createWidget(hmUI.widget.IMG, {
            x: args.x + args.w - args.h,
            y: args.y,
            w: args.h,
            h: args.h,
            src: args.buttons.img_up
        })

        args.x += args.h + 5
        args.y += args.h / 4
        args.w -= args.h * 2 + 10
        args.h /= 2
    }

    let sliderRow = hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: args.x,
        y: args.y,
        w: args.w,
        h: args.h,
        radius: args.h / 2,
        color: args.backColor
    });

    let sliderPoint = hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: args.x,
        y: args.hasPoint ? args.y - args.h / 2 : args.y,
        w: args.hasPoint ? args.h * 2 : args.h / 2,
        h: args.hasPoint ? args.h * 2 : args.h,
        radius: args.h / 2,
        color: args.frontColor
    });

    let sliderValue = 0;

    const onSliderMove = (info) => {
        let value = 0;
        if (args.hasPoint) {
            value = info.x - args.h
            value = Math.max(value, args.x - args.h)
            value = Math.min(value, args.x + args.w - args.h)
            sliderValue = (value - args.x + args.h) / args.w
        } else {
            value = info.x - args.x
            value = Math.max(value, 0)
            value = Math.min(value, args.x + args.w)
            sliderValue = (value / args.w)
        }

        if (args.hasPoint)
            sliderPoint.setProperty(
                hmUI.prop.MORE,
                { x: value }
            );
        else
            sliderPoint.setProperty(
                hmUI.prop.MORE,
                { w: value }
            );
        args.onSliderMove(args.ctx, sliderValue, true)
    };

    const setPosition = (floatvalue, isUserInput = false) => {
        sliderValue = floatvalue;
        if (args.hasPoint)
            sliderPoint.setProperty(
                hmUI.prop.MORE,
                { x: floatvalue * args.w + args.x - (args.h) })
        else
            sliderPoint.setProperty(
                hmUI.prop.MORE,
                { w: floatvalue * args.w });
        args.onSliderMove(args.ctx, floatvalue, isUserInput)
    };

    const getPosition = () => {
        return sliderValue
    };

    let components = [sliderRow, sliderPoint]

    if (args.buttons) {
        components.push(downButton, upButton)
        downButton.addEventListener(hmUI.event.CLICK_UP, (info) => { setPosition(Math.max(0, sliderValue - args.buttons.change_amt), true) })
        upButton.addEventListener(hmUI.event.CLICK_UP, (info) => { setPosition(Math.min(1, sliderValue + args.buttons.change_amt), true) })
    }
    else {
        sliderRow.addEventListener(hmUI.event.CLICK_UP, onSliderMove)

        if (args.hasPoint)
            sliderPoint.addEventListener(hmUI.event.CLICK_UP, onSliderMove);
        else
            sliderPoint.setEnable(false);
    }

    return { setPosition, getPosition, components }
};