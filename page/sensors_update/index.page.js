import { DEVICE_HEIGHT, DEVICE_WIDTH, TOP_BOTTOM_OFFSET } from "../home/index.style";
const logger = DeviceRuntimeCore.HmLogger.getLogger("ha-zepp-update-sensors");
const { messageBuilder, appId } = getApp()._options.globalData;
const POLL_ALARM_PREF_ID = 'my_bluetooth_poll_alarm'

const vibrate = hmSensor.createSensor(hmSensor.id.VIBRATE)

Page({
    state: {
        text: null,
    },
    onInit(param) {
        logger.debug('onInit')
        vibrate.stop()
        vibrate.scene = 27

        if (param === POLL_ALARM_PREF_ID) {
            const existingAlarm = hmFS.SysProGetInt64(POLL_ALARM_PREF_ID)
            if (existingAlarm) {
                hmApp.alarmCancel(existingAlarm)
            }
        }
        const alarm = hmApp.alarmNew({
            file: 'page/sensors_update/index.page',
            appid: 391257,
            delay: 600,
            param: POLL_ALARM_PREF_ID
        })
        hmFS.SysProSetInt64(POLL_ALARM_PREF_ID, alarm)
        logger.debug("ALARM ID: " + alarm)
    },
    drawAlarmId(alarmId) {
        if (this.state.text != null) {
            hmUI.deleteWidget(this.state.text);
        }
        const text = hmUI.createWidget(hmUI.widget.TEXT, {
          x: 0,
          y: 0,
          w: DEVICE_WIDTH,
          h: DEVICE_HEIGHT,
          text: alarmId,
          text_size: 18,
          color: 0xffffff,
          align_h: hmUI.align.CENTER_H,
          align_v: hmUI.align.CENTER_V,
        });
        this.state.text = text
    },
    build() {
        if (hmBle.connectStatus() === true) {
            const nickName = hmSetting.getUserData().nickName;
            const deviceId = (hmSetting.getDeviceInfo().deviceName + "_" 
            + nickName).toLowerCase().replaceAll(" ", "_");  

            // do the sensor updates.....
            const heart = hmSensor.createSensor(hmSensor.id.HEART)
            //const rand = Math.floor(Math.random() * 100)
            logger.debug("DEVICEID: " + deviceId)
            messageBuilder
                .request({ 
                    method: "UPDATE_SENSORS", 
                    sensor_name: "heart_rate", 
                    state: heart.last,//rand,
                    unit_of_measurement: "bpm",
                    friendly_name: nickName + " Heart Rate",//"Bram Heart Rate",
                    device_id: deviceId,//"xiaomi_smart_band_7_bram", 
                    values: heart.today
                })
                .then(({ result }) => {
                    console.log(result);
                    hmApp.goBack();
                }) // also catch error from HTTP response here (also goback()???)
            //hmApp.goBack()
        } else {
            vibrate.start()
        }
    },
    onDestroy() {
        vibrate && vibrate.stop()
     },
});