import "./shared/device-polyfill";
import { MessageBuilder } from "./shared/message";

const appDevicePort = 20;
const appSidePort = 0;
const appId = 391257;
const messageBuilder = new MessageBuilder({
  appId,
});

App({
  globalData: {
    messageBuilder: messageBuilder,
  },
  onCreate() {
    messageBuilder.connect();
  },

  onDestroy() {
    messageBuilder.disConnect();
  },
});
