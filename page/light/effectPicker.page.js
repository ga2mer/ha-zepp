import { DEVICE_HEIGHT, DEVICE_WIDTH, TOP_BOTTOM_OFFSET } from "../home/index.style";
import { createSlider } from "../../controls/slider";
const { messageBuilder } = getApp()._options.globalData;
const logger = DeviceRuntimeCore.HmLogger.getLogger("ha-zepp-light-effectPicker");

Page({
    state: {
        y: TOP_BOTTOM_OFFSET,
        item: null,
        widgets: [],
        rendered: false,
        reloadTimer: null
    },
    addWidget(widget) {
        this.state.widgets.push(widget);
    },
    createWidget(...args) {
        const widget = hmUI.createWidget(...args);
        this.state.widgets.push(widget);
        return widget;
    },
    clearWidgets() {
        this.state.widgets.forEach((widget, index) => {
            hmUI.deleteWidget(widget);
        });
        this.state.widgets = [];
        this.state.rendered = false;
        this.state.y = TOP_BOTTOM_OFFSET; // start from this y to skip rounded border
        // hmUI.redraw();
    },
    drawElements() {
        this.state.rendered = false;
        this.clearWidgets()

        if (typeof this.state.item !== 'object') {
            this.drawError("Wrong sensor data " + typeof this.state.item)
            return;
        }

        const titleHeight = 40;

        this.createWidget(hmUI.widget.TEXT, {
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

        if (this.state.item.attributes.effect) {
            this.createWidget(hmUI.widget.TEXT, {
                x: 10,
                y: this.state.y,
                w: DEVICE_WIDTH / 3,
                h: 32,
                text: "Effect:",
                text_size: 17,
                color: 0xffffff,
                align_h: hmUI.align.LEFT,
            });

            const effectText = this.createWidget(hmUI.widget.TEXT, {
                x: 10 + DEVICE_WIDTH / 3,
                y: this.state.y,
                w: DEVICE_WIDTH / 3 * 2 - 20,
                h: 32,
                text: this.state.item.attributes.effect,
                text_size: 17,
                color: 0xffffff,
                align_h: hmUI.align.RIGHT,
            });
            this.state.y += 32

            const dataList = this.state.item.attributes.effect_list.map((item) => { return { name: item } })

            function scrollListItemClick(list, index, ctx) {
                effectText.setProperty(hmUI.prop.TEXT, dataList[index].name)

                list.setProperty(hmUI.prop.UPDATE_DATA, {
                    data_type_config: [
                        {
                            start: 0,
                            end: index - 1,
                            type_id: 0
                        },
                        {
                            start: index,
                            end: index,
                            type_id: 1
                        },
                        {
                            start: index + 1,
                            end: dataList.length,
                            type_id: 0
                        },
                    ],
                    data_type_config_count: 3,
                    data_array: dataList,
                    data_count: dataList.length,
                    on_page: 1
                })

                if (ctx.state.rendered) {
                    messageBuilder.request(
                        {
                            method: "LIGHT_SET",
                            entity_id: ctx.state.item.key,
                            value: `{"effect": "${dataList[index].name}"}`,
                            service: ctx.state.item.type
                        });
                }
            }



            const effectList = hmUI.createWidget(hmUI.widget.SCROLL_LIST, {
                x: 10,
                y: this.state.y + 20,
                h: DEVICE_HEIGHT - this.state.y - 20,
                w: DEVICE_WIDTH - 20,
                item_space: 10,
                item_config: [
                    {
                        type_id: 0,
                        item_bg_color: 0x101010,
                        item_bg_radius: 10,
                        text_view: [
                            { x: 10, y: 16, w: DEVICE_WIDTH - 40, h: 32, key: 'name', color: 0xffffff, text_size: 18 },
                        ],
                        text_view_count: 1,
                        item_height: 64
                    },
                    {
                        type_id: 1,
                        item_bg_color: 0x262626,
                        item_bg_radius: 10,
                        text_view: [
                            { x: 10, y: 16, w: DEVICE_WIDTH - 40, h: 32, key: 'name', color: 0xffffff, text_size: 18 },
                        ],
                        text_view_count: 1,
                        item_height: 64
                    },
                ],
                item_config_count: 2,
                data_array: dataList,
                data_count: dataList.length,
                item_click_func: (list,index) => scrollListItemClick(list, index, this),
                data_type_config_count: 1
            })

            scrollListItemClick(effectList, this.state.item.attributes.effect_list.indexOf(this.state.item.attributes.effect), this)
        }
        else {
            hmApp.goBack()
        }

        this.state.rendered = true;
    },
    onInit(param) {
        logger.log('onInit')
        logger.log("param", param)
        this.state.item = JSON.parse(param)
        this.drawElements()
    },
    build() { },
    onDestroy() { }
});