/**
 * @param {object} args {
 *                          h: number, //height of thickest part
 *                          w: number,
 *                          x: number,
 *                          y: number,
 *                          hasPoint: boolean,
 *                          ctx: object,
 *                          onSliderMove: function(ctx,floatpos),
 *                          frontColor: number,
 *                          backColor: number,
 *                      }
 * @returns {object} {
 *                      setPosition(floatpos),
 *                      components: array[Widget],
 *                   } 
 */
export function createSlider(args) {
    console.log(JSON.stringify(args))
    const sliderRow = hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: args.x,
        y: args.y,
        w: args.w,
        h: args.h,
        radius: args.h / 2,
        color: args.backColor
    });

    const sliderPoint = hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: args.x,
        y: args.y - args.h / 2,
        w: args.hasPoint ? args.h * 2 : args.h / 2,
        h: args.hasPoint ? args.h * 2 : args.h,
        radius: args.h / 2,
        color: args.frontColor
    });
    sliderPoint.setEnable(false);

    sliderRow.addEventListener(hmUI.event.CLICK_UP, (info) => {
        let value = 0;
        let floatvalue = 0;
        if (args.hasPoint) {
            value = info.x - args.h
            value = Math.max(value, args.x - args.h)
            value = Math.min(value, args.x + args.w - args.h)
            floatvalue = (value - args.x + args.h) / args.w
        } else {
            value = info.x - args.x
            value = Math.max(value, 0)
            value = Math.min(value, args.x + args.w)
            floatvalue = (value / args.w)
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

        args.onSliderMove(args.ctx, floatvalue.toFixed(2))
    })

    const setPosition = (floatpos) => {
        if (args.hasPoint)
            sliderPoint.setProperty(
                hmUI.prop.MORE,
                { x: floatpos * args.w + args.x - (args.h) })
        else
            sliderPoint.setProperty(
                hmUI.prop.MORE,
                { w: floatpos * args.w })
    };

    return { setPosition, components: [sliderRow, sliderPoint] }
};