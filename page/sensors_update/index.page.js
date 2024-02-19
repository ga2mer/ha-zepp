import { DEVICE_HEIGHT, DEVICE_WIDTH } from "../home/index.style";
const logger = DeviceRuntimeCore.HmLogger.getLogger("ha-zepp-update-sensors");
const { messageBuilder, appId, FS_REF_SENSORS_UPDATE_ALARM_ID } =
  getApp()._options.globalData;

const vibrate = hmSensor.createSensor(hmSensor.id.VIBRATE);

Page({
  state: {
    textWidget: null,
    deviceId: null,
    nickName: null,
    nUpdated: 0,
  },
  onInit(param) {
    logger.debug("onInit");
    vibrate.stop();
    vibrate.scene = 23;

    const existingAlarm = hmFS.SysProGetInt64(FS_REF_SENSORS_UPDATE_ALARM_ID);
    if (param === FS_REF_SENSORS_UPDATE_ALARM_ID) {
      if (existingAlarm) {
        hmApp.alarmCancel(existingAlarm);
        hmFS.SysProSetInt64(FS_REF_SENSORS_UPDATE_ALARM_ID, -1);
      }
      const alarm = hmApp.alarmNew({
        file: "page/sensors_update/index.page",
        appid: appId,
        delay: 3600,
        param: FS_REF_SENSORS_UPDATE_ALARM_ID,
      });
      hmFS.SysProSetInt64(FS_REF_SENSORS_UPDATE_ALARM_ID, alarm);
      logger.debug("ALARM ID: " + alarm);
    }
  },
  clearTextMessage() {
    if (this.state.textWidget != null) {
      hmUI.deleteWidget(this.state.textWidget);
      this.state.textWidget = null;
      hmUI.redraw();
    }
  },
  drawTextMessage(message) {
    this.clearTextMessage();
    const text = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 0,
      y: 0,
      w: DEVICE_WIDTH,
      h: DEVICE_HEIGHT,
      text: message,
      text_size: 18,
      color: 0xffffff,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
    });
    this.state.textWidget = text;
  },
  drawError(message) {
    vibrate.start();
    let text = "Error during sensor update";
    if (typeof message === "string") {
      text += ":\n";
      text += message;
    }
    return this.drawTextMessage(text);
  },
  updateSensors() {
    this.drawTextMessage("Updating sensors\nto Home Assistant");
    this.updateHeartRate();
    this.updateSleep();
    this.updateBattery();
    this.updateSteps();
    this.updateDistance();
    this.updateFatBurning();
    this.updatePAI();
    this.updateStand();
    this.updateWear();
    this.updateCalories();
  },
  updateHeartRate() {
    const heart = hmSensor.createSensor(hmSensor.id.HEART);
    logger.debug("Updating heart rate: " + heart.last);
    messageBuilder
      .request({
        method: "UPDATE_SENSORS",
        sensor_name: "heart_rate",
        state: heart.last,
        device_id: this.state.deviceId,
        attributes: {
          unit_of_measurement: "bpm",
          friendly_name: this.state.nickName + " Heart Rate",
          today_values: heart.today,
        },
      })
      .then(({ result, error }) => {
        if (error) {
          this.drawError(error);
          return;
        }
        this.state.nUpdated += 1;
        this.drawTextMessage(
          "Updated HEART RATE\nto Home Assistant\n" +
            this.state.nUpdated +
            "/10"
        );
        if (this.state.nUpdated == 10) hmApp.gotoHome();
      })
      .catch((res) => {
        this.drawError();
        console.log(res);
      });
  },
  updateSleep() {
    const sleep = hmSensor.createSensor(hmSensor.id.SLEEP);
    sleep.updateInfo();
    const basicInfo = sleep.getBasicInfo();
    const sleepTime = sleep.getTotalTime();
    const sleepStageArray = sleep.getSleepStageData();
    const sleepHrData = sleep.getSleepHrData();
    logger.debug("Updating Sleep Data: " + sleepTime);
    messageBuilder
      .request({
        method: "UPDATE_SENSORS",
        sensor_name: "sleep_minutes",
        state: sleepTime,
        device_id: this.state.deviceId,
        attributes: {
          unit_of_measurement: "min",
          friendly_name: this.state.nickName + " Sleep Minutes",
          sleep_score: basicInfo.score,
          sleep_start_time: basicInfo.startTime,
          sleep_end_time: basicInfo.endTime,
          deep_sleep_minutes: basicInfo.deepMin,
          sleep_stage_data: sleepStageArray,
          sleep_hr_data: sleepHrData,
        },
      })
      .then(({ result, error }) => {
        if (error) {
          this.drawError(error);
          return;
        }
        this.state.nUpdated += 1;
        this.drawTextMessage(
          "Updated SLEEP\nto Home Assistant\n" + this.state.nUpdated + "/10"
        );
        if (this.state.nUpdated == 10) hmApp.gotoHome();
      })
      .catch((res) => {
        this.drawError();
        console.log(res);
      });
  },
  updateSteps() {
    const step = hmSensor.createSensor(hmSensor.id.STEP);
    logger.debug("Updating daily steps: " + step.current);
    messageBuilder
      .request({
        method: "UPDATE_SENSORS",
        sensor_name: "steps_daily",
        state: step.current,
        device_id: this.state.deviceId,
        attributes: {
          unit_of_measurement: "steps",
          friendly_name: this.state.nickName + " Daily Steps",
          daily_steps_target: step.target,
        },
      })
      .then(({ result, error }) => {
        if (error) {
          this.drawError(error);
          return;
        }
        this.state.nUpdated += 1;
        this.drawTextMessage(
          "Updated STEPS\nto Home Assistant\n" + this.state.nUpdated + "/10"
        );
        if (this.state.nUpdated == 10) hmApp.gotoHome();
      })
      .catch((res) => {
        this.drawError();
        console.log(res);
      });
  },
  updateBattery() {
    const battery = hmSensor.createSensor(hmSensor.id.BATTERY);
    logger.debug("Updating battery: " + battery.current);
    messageBuilder
      .request({
        method: "UPDATE_SENSORS",
        sensor_name: "battery",
        state: battery.current,
        device_id: this.state.deviceId,
        attributes: {
          unit_of_measurement: "%",
          friendly_name: this.state.nickName + " Battery",
        },
      })
      .then(({ result, error }) => {
        if (error) {
          this.drawError(error);
          return;
        }
        this.state.nUpdated += 1;
        this.drawTextMessage(
          "Updated BATTERY\nto Home Assistant\n" + this.state.nUpdated + "/10"
        );
        if (this.state.nUpdated == 10) hmApp.gotoHome();
      })
      .catch((res) => {
        this.drawError();
        console.log(res);
      });
  },
  updatePAI() {
    const pai = hmSensor.createSensor(hmSensor.id.PAI);
    logger.debug("Updating calories: " + pai.dailypai);
    messageBuilder
      .request({
        method: "UPDATE_SENSORS",
        sensor_name: "pai",
        state: pai.dailypai,
        device_id: this.state.deviceId,
        attributes: {
          unit_of_measurement: "pai",
          friendly_name: this.state.nickName + " PAI",
          total_pai: pai.totalpai,
          six_days_before_pai: pai.prepai0,
          five_days_before_pai: pai.prepai1,
          four_days_before_pai: pai.prepai2,
          three_days_before_pai: pai.prepai3,
          two_days_before_pai: pai.prepai4,
          one_day_before_pai: pai.prepai5,
          today_pai: pai.prepai6,
        },
      })
      .then(({ result, error }) => {
        if (error) {
          this.drawError(error);
          return;
        }
        this.state.nUpdated += 1;
        this.drawTextMessage(
          "Updated PAI\nto Home Assistant\n" + this.state.nUpdated + "/10"
        );
        if (this.state.nUpdated == 10) hmApp.gotoHome();
      })
      .catch((res) => {
        this.drawError();
        console.log(res);
      });
  },
  updateDistance() {
    const distance = hmSensor.createSensor(hmSensor.id.DISTANCE);
    logger.debug("Updating distance: " + distance.current);
    messageBuilder
      .request({
        method: "UPDATE_SENSORS",
        sensor_name: "distance_travelled",
        state: distance.current,
        device_id: this.state.deviceId,
        attributes: {
          unit_of_measurement: "m",
          friendly_name: this.state.nickName + " Distance Travelled",
        },
      })
      .then(({ result, error }) => {
        if (error) {
          this.drawError(error);
          return;
        }
        this.state.nUpdated += 1;
        this.drawTextMessage(
          "Updated DISTANCE\nto Home Assistant\n" + this.state.nUpdated + "/10"
        );
        if (this.state.nUpdated == 10) hmApp.gotoHome();
      })
      .catch((res) => {
        this.drawError();
        console.log(res);
      });
  },
  updateStand() {
    const stand = hmSensor.createSensor(hmSensor.id.STAND);
    logger.debug("Updating stand: " + stand.current);
    messageBuilder
      .request({
        method: "UPDATE_SENSORS",
        sensor_name: "standing_hours",
        state: stand.current,
        device_id: this.state.deviceId,
        attributes: {
          unit_of_measurement: "h",
          friendly_name: this.state.nickName + " Standing Hours",
          standing_hours_target: stand.target,
        },
      })
      .then(({ result, error }) => {
        if (error) {
          this.drawError(error);
          return;
        }
        this.state.nUpdated += 1;
        this.drawTextMessage(
          "Updated STAND\nto Home Assistant\n" + this.state.nUpdated + "/10"
        );
        if (this.state.nUpdated == 10) hmApp.gotoHome();
      })
      .catch((res) => {
        this.drawError();
        console.log(res);
      });
  },
  updateFatBurning() {
    const fatburn = hmSensor.createSensor(hmSensor.id.FAT_BURRING);
    logger.debug("Updating Fat Burning: " + fatburn.current);
    messageBuilder
      .request({
        method: "UPDATE_SENSORS",
        sensor_name: "fat_burning_minutes",
        state: fatburn.current,
        device_id: this.state.deviceId,
        attributes: {
          unit_of_measurement: "min",
          friendly_name: this.state.nickName + " Fat Burning Minutes",
          fat_burning_minutes_target: fatburn.target,
        },
      })
      .then(({ result, error }) => {
        if (error) {
          this.drawError(error);
          return;
        }
        this.state.nUpdated += 1;
        this.drawTextMessage(
          "Updated FAT BURNING\nto Home Assistant\n" +
            this.state.nUpdated +
            "/10"
        );
        if (this.state.nUpdated == 10) hmApp.gotoHome();
      })
      .catch((res) => {
        this.drawError();
        console.log(res);
      });
  },
  updateWear() {
    const wear = hmSensor.createSensor(hmSensor.id.WEAR);
    logger.debug("Updating Wear: " + wear.current);
    let status = "";
    switch (wear.current) {
      case 0:
        status = "Not worn";
        break;
      case 1:
        status = "Wearing";
        break;
      case 2:
        status = "In motion";
        break;
      case 3:
        status = "Not sure";
        break;
      default:
        status = "Unknown status code";
    }
    messageBuilder
      .request({
        method: "UPDATE_SENSORS",
        sensor_name: "current_wear_status",
        state: status,
        device_id: this.state.deviceId,
        attributes: {
          friendly_name: this.state.nickName + " Current Wear Status",
        },
      })
      .then(({ result, error }) => {
        if (error) {
          this.drawError(error);
          return;
        }
        this.state.nUpdated += 1;
        this.drawTextMessage(
          "Updated WEAR\nto Home Assistant\n" + this.state.nUpdated + "/10"
        );
        if (this.state.nUpdated == 10) hmApp.gotoHome();
      })
      .catch((res) => {
        this.drawError();
        console.log(res);
      });
  },
  updateCalories() {
    const calorie = hmSensor.createSensor(hmSensor.id.CALORIE);
    logger.debug("Updating calories: " + calorie.current);
    messageBuilder
      .request({
        method: "UPDATE_SENSORS",
        sensor_name: "calories_burnt_daily",
        state: calorie.current,
        device_id: this.state.deviceId,
        attributes: {
          unit_of_measurement: "kcal",
          friendly_name: this.state.nickName + " Burnt Calories",
          burnt_calories_target: calorie.target,
        },
      })
      .then(({ result, error }) => {
        if (error) {
          this.drawError(error);
          return;
        }
        this.state.nUpdated += 1;
        this.drawTextMessage(
          "Updated CALORIES\nto Home Assistant\n" + this.state.nUpdated + "/10"
        );
        if (this.state.nUpdated == 10) hmApp.gotoHome();
      })
      .catch((res) => {
        this.drawError();
        console.log(res);
      });
  },
  build() {
    if (hmBle.connectStatus() === true) {
      this.state.nickName = hmSetting.getUserData().nickName;
      this.state.deviceId = (
        hmSetting.getDeviceInfo().deviceName +
        "_" +
        this.state.nickName
      )
        .toLowerCase()
        .replaceAll(" ", "_");
      // do the sensor updates.....
      this.updateSensors();
    } else {
      vibrate.start();
    }
  },
  onDestroy() {
    hmUI.setStatusBarVisible(false);
    vibrate && vibrate.stop();
  },
});
