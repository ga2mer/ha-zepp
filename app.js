import "./shared/device-polyfill";
import { MessageBuilder } from "./shared/message";

const FS_REF_SENSORS_UPDATE_ALARM_ID = 'sensors_update_alarm_id'
const FS_REF_SENSORS_UPDATE_STATE = 'sensors_update_state'
const FS_REF_SENSORS_UPDATE_TIMESTAMP = 'sensors_update_timestamp'

const appDevicePort = 20;
const appSidePort = 0;
const appId = 391257;
const messageBuilder = new MessageBuilder({
  appId,
});

hmUI.setStatusBarVisible(false);

App({
  globalData: {
    messageBuilder: messageBuilder,
    appId: appId,
    FS_REF_SENSORS_UPDATE_ALARM_ID,
    FS_REF_SENSORS_UPDATE_STATE  
  },
  onCreate() {
    messageBuilder.connect();
  },

  onDestroy() {
    messageBuilder.disConnect();
  },
});
