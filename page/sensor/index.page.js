import { getEveryNth } from "../../utils";
import AppPage from "../Page";
import { BUTTON_COLOR_PRESSED, DEVICE_HEIGHT, DEVICE_WIDTH, TOP_BOTTOM_OFFSET } from "../home/index.style";

const logger = DeviceRuntimeCore.HmLogger.getLogger("ha-zepp-sensor");
const { messageBuilder } = getApp()._options.globalData;

class SensorPage extends AppPage {
    constructor(...props) {
        super(...props);
    }

    //taken and slightly modified from https://stackoverflow.com/a/67338038
    fromNow(date) {
        const SECOND = 1000;
        const MINUTE = 60 * SECOND;
        const HOUR = 60 * MINUTE;
        const DAY = 24 * HOUR;
        const WEEK = 7 * DAY;
        const YEAR = 365 * DAY;
        const MONTH = YEAR / 12;
        const units = [
            { max: 30 * SECOND, divisor: 1, past1: 'just now', pastN: 'just now' },
            { max: MINUTE, divisor: SECOND, past1: 'a second ago', pastN: '# seconds ago' },
            { max: HOUR, divisor: MINUTE, past1: 'a minute ago', pastN: '# minutes ago' },
            { max: DAY, divisor: HOUR, past1: 'an hour ago', pastN: '# hours ago' },
            { max: WEEK, divisor: DAY, past1: 'yesterday', pastN: '# days ago' },
            { max: 4 * WEEK, divisor: WEEK, past1: 'last week', pastN: '# weeks ago' },
            { max: Infinity, divisor: MONTH, past1: 'long ago', pastN: 'long ago' }
        ];
        const diff = Date.now() - date;
        const diffAbs = Math.abs(diff);
        for (const unit of units) {
            if (diffAbs < unit.max) {
                const x = Math.round(Math.abs(diff) / unit.divisor);
                if (x <= 1) unit.past1;
                return unit.pastN.replace('#', x);
            }
        }
    }
    getSensorInfo() {
        messageBuilder
            .request({ method: "GET_SENSOR", entity_id: this.item.key })
            .then(({ result, error }) => {
                if (error) {
                    this.drawError(error);
                    return;
                }
                this.item = result;
                this.drawElements();
            })
            .catch((res) => {
                this.drawError();
            });
    }

    getSensorLog() {
        messageBuilder
            .request({ method: "GET_SENSOR_LOG", entity_id: this.item.key })
            .then(({ result, error }) => {
                if (error) {
                    this.drawError(error);
                    return;
                }
                this.drawLog(result);
            })
            .catch((res) => {
                console.log(res)
                this.drawLog(null);
            });
    }

    drawElements() {
        this.state.rendered = false;
        this.clearWidgets()

        const titleHeight = 40;

        this.createWidget(hmUI.widget.TEXT, {
            x: 0,
            y: this.state.y,
            w: DEVICE_WIDTH,
            h: titleHeight,
            text: this.item.title,
            text_size: 19,
            color: 0xffffff,
            align_h: hmUI.align.CENTER_H,
        });
        this.state.y += titleHeight + 10

        var allowedtypes = ["temperature", "humidity"]

        const imgSize = 48

        this.createWidget(hmUI.widget.IMG, {
            x: 10,
            y: this.state.y,
            h: imgSize,
            w: imgSize,
            src: (allowedtypes.includes(this.item.attributes.device_class) ? this.item.attributes.device_class : 'eye') + ".png"
        })

        this.createWidget(hmUI.widget.TEXT, {
            x: 20 + imgSize,
            y: this.state.y + (imgSize / 2) - 12,
            h: 24,
            w: DEVICE_WIDTH - (20 + imgSize) - 10,
            align_v: hmUI.align.CENTER_V,
            color: 0xffffff,
            text_size: 21,
            text: this.item.state + (this.item.unit || "")
        })

        this.state.y += imgSize + 10

        this.createWidget(hmUI.widget.TEXT, {
            x: 10,
            y: this.state.y,
            h: 24,
            w: DEVICE_WIDTH / 2,
            color: 0xffffff,
            text_size: 19,
            text: "Updated:"
        })

        this.createWidget(hmUI.widget.TEXT, {
            x: DEVICE_WIDTH / 2,
            y: this.state.y,
            h: 24,
            w: DEVICE_WIDTH / 2 - 10,
            color: 0xffffff,
            text_size: 19,
            text: this.fromNow(Date.parse(this.item.last_changed))
        })

        this.state.y += 24 + 10

        this.createWidget(hmUI.widget.TEXT, {
            x: 10,
            y: this.state.y,
            h: 24,
            w: DEVICE_WIDTH - 20,
            color: 0xffffff,
            text_size: 17,
            text: "Sensor history:"
        })
        this.state.y += 24 + 5

        this.getSensorLog()

        this.state.rendered = true;
    }

    /**
     * 
     * @param {Array<string>} log 
     */
    drawLog(log) {
        if (log == null || log.length <= 3) {
            this.createWidget(hmUI.widget.TEXT, {
                x: 10,
                y: this.state.y,
                h: 24,
                w: DEVICE_WIDTH - 20,
                color: 0xffffff,
                text_size: 17,
                text: log == null ? "error while loading history" : "history is too short"
            })
            this.state.y += 24 + 5
        }
        else {
            //pretty dumb code, i`m sorry.. but it works ;)
            const viewHeight = DEVICE_HEIGHT - this.state.y - TOP_BOTTOM_OFFSET
            const data_array = log.map(e => Math.ceil(parseFloat(e)))
            const data_min_value = Math.min(...data_array)
            const data_max_value = Math.max(...data_array)

            const data_middle_mult = (data_max_value - data_min_value) / 4
            var y_text_array = [
                data_min_value,
                data_min_value + data_middle_mult,
                data_min_value + data_middle_mult * 2,
                data_min_value + data_middle_mult * 3,
                data_max_value
            ].map(e => Math.round(e).toString());

            const item_width = Math.min(30, (DEVICE_WIDTH - 10 - (data_array.length) * 5) / data_array.length)

            console.log(item_width, (DEVICE_WIDTH - 10 - (data_array.length) * 5) / data_array.length)

            const view = this.createWidget(hmUI.widget.HISTOGRAM, {
                x: 5,
                y: this.state.y,
                h: viewHeight,
                w: DEVICE_WIDTH - 10,
                item_width,
                item_space: 5,
                item_radius: item_width / 2,
                item_start_y: 20,
                item_max_height: viewHeight - 20,
                item_color: BUTTON_COLOR_PRESSED,
                data_array,
                data_count: data_array.length,
                data_min_value: data_min_value - 10,
                data_max_value,
                xline: {
                    pading: 0,
                    space: 0,
                    start: 0,
                    end: 0,
                    color: 0x000000,
                    width: 0,
                    count: 0
                },
                yline: {
                    pading: 10,
                    space: 10,
                    start: 0,
                    end: 300,
                    color: 0x6a6a6a,
                    width: 1,
                    count: 30
                },
                xText: {
                    x: 0,
                    y: 0,
                    w: 0,
                    h: 0,
                    space: 0,
                    align: hmUI.align.LEFT,
                    color: 0xffffff,
                    count: 0,
                    data_array: []
                },
                yText: {
                    x: 0,
                    y: 20,
                    w: 50,
                    h: 35,
                    space: 5,
                    align: hmUI.align.LEFT,
                    color: 0xffffff,
                    count: y_text_array.length,
                    data_array: y_text_array.reverse()
                }
            })
        }
    }

    onInit(param) {
        logger.log('onInit')
        logger.log("param", param)
        this.item = param;
    }

    onRender() {
        this.drawWait()
        this.getSensorInfo()
    }

    onDestroy() {
        this.state.rendered = false
    }
}

export default SensorPage;