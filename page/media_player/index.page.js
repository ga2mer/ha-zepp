import AppPage from "../Page";
import {
  DEVICE_HEIGHT,
  DEVICE_WIDTH,
  TOP_BOTTOM_OFFSET,
} from "../home/index.style";
import { createSlider } from "../../controls/slider";
import { createProgressBar } from "../../controls/progressBar";
import NativeSliderModal from "../modal/NativeSliderModal";
const { messageBuilder } = getApp()._options.globalData;
const logger = DeviceRuntimeCore.HmLogger.getLogger("ha-zepp-mediaplayer");

class Index extends AppPage {
  constructor(...props) {
    super(...props);
    this.state.item = null;
    this.state.rendered = false;
    this.state.reloadTimer = null;
    this.state.arcUpdateTimer = null;
    this.state.volumeBar = null;
    this.state.volumeSlider = null;
    this.state.titleText = null;
    this.state.artistText = null;
    this.state.positionArc = null;
    this.state.playButton = null;
    this.state.isPlaying = false;
  }
  addWidgets(widgets) {
    this.app.widgets.push(...widgets);
  }
  destroyTimers() {
    if (this.state.arcUpdateTimer) {
      timer.stopTimer(this.state.arcUpdateTimer);
      this.state.arcUpdateTimer = null;
    }

    if (this.state.reloadTimer) {
      timer.stopTimer(this.state.reloadTimer);
      this.state.reloadTimer = null;
    }
  }
  getSensorInfo() {
    messageBuilder
      .request({ method: "GET_SENSOR", entity_id: this.state.item.key })
      .then(({ result, error }) => {
        if (error) {
          if (this.state.rendered) {
            this.clearWidgets();
          }
          this.drawError(error);
          return;
        }
        this.state.item = result;

        if (!this.state.rendered) this.drawElements();
        else this.updateElementsData();
      })
      .catch((res) => {
        this.drawError();
        console.log(res);
      });
  }
  setReloadTimer(delay) {
    if (this.state.reloadTimer) timer.stopTimer(this.state.reloadTimer);

    this.state.reloadTimer = timer.createTimer(
      delay,
      10000,
      function (page) {
        page.getSensorInfo();
      },
      this
    );
  }
  setArcUpdateTimer(state) {
    if (state && !this.state.arcUpdateTimer) {
      this.state.arcUpdateTimer = timer.createTimer(
        0,
        1000,
        function (page) {
          page.state.item.attributes.media_position = Math.min(
            page.state.item.attributes.media_position + 1,
            page.state.item.attributes.media_duration
          );
          page.setArcPosition(
            page.state.item.attributes.media_position /
            page.state.item.attributes.media_duration
          );

          if (
            page.state.item.attributes.media_position ==
            page.state.item.attributes.media_duration
          ) {
            page.setArcUpdateTimer(false);
            page.setReloadTimer(1000);
          }
        },
        this
      );
    }
    if (!state && this.state.arcUpdateTimer) {
      timer.stopTimer(this.state.arcUpdateTimer);
      this.state.arcUpdateTimer = null;
    }
  }
  doMediaAction(action) {
    messageBuilder.request({
      method: "MEDIA_ACTION",
      entity_id: this.state.item.key,
      value: "{}",
      service: "media_" + action,
    });

    if (action.includes("_track")) {
      this.getSensorInfo(1000);
    } else {
      if (this.positionArc) this.setArcUpdateTimer(action === "play");
      this.state.isPlaying = action === "play";
    }
  }
  setArcPosition(floatvalue) {
    this.state.positionArc.setProperty(hmUI.prop.MORE, {
      end_angle: Math.min(270, Math.round(floatvalue * 360) - 90),
    });
  }
  updateElementsData() {
    this.state.isPlaying = this.state.item.state === "playing";

    this.state.playButton.setProperty(hmUI.prop.MORE, {
      src: (this.state.isPlaying ? "pause" : "play") + ".png"
    })

    if (this.state.positionArc) {
      this.setArcPosition(
        this.state.item.attributes.media_position /
        this.state.item.attributes.media_duration
      );
      this.setArcUpdateTimer(this.state.isPlaying);
    }

    if (this.state.titleText)
      this.state.titleText.setProperty(
        hmUI.prop.TEXT,
        this.state.item.attributes.media_title
      );

    if (this.state.artistText)
      this.state.artistText.setProperty(
        hmUI.prop.TEXT,
        this.state.item.attributes.media_artist
      );

    if (typeof this.state.item.attributes.is_volume_muted === "boolean")
      this.state.volumeSlider.setButtonToggle(this.state.item.attributes.is_volume_muted);

    if (typeof this.state.item.attributes.volume_level === "number") {
      this.state.volumeBar.setPosition(this.state.item.attributes.volume_level);
      this.state.volumeSlider.setPosition(this.state.item.attributes.volume_level);
    }
  }
  drawElements() {
    this.state.rendered = false;
    this.clearWidgets();

    if (typeof this.state.item !== "object") {
      this.drawError("Wrong sensor data " + typeof this.state.item);
      return;
    }

    const seekButtonsHeight = 60;

    if (this.state.item.attributes.supported_features & 16) {
      //PREVIOUS_TRACK  https://github.com/home-assistant/core/blob/e9705364a80fff9c18e2e24b0c0dceff0a71df6e/homeassistant/components/media_player/const.py#L179
      this.createWidget(hmUI.widget.BUTTON, {
        x: 0,
        y: 0,
        w: DEVICE_WIDTH,
        h: seekButtonsHeight,
        normal_src: "skip_previous.png",
        press_src: "skip_previous_pressed.png",
        click_func: () => {
          this.doMediaAction("previous_track");
        },
      });
    }

    this.state.y = 60 + 10;

    const titleHeight = 40;
    const valueHeight = 48;

    this.createWidget(hmUI.widget.TEXT, {
      x: 10,
      y: this.state.y,
      w: DEVICE_WIDTH - 20,
      h: titleHeight,
      text: this.state.item.title,
      text_size: 19,
      color: 0xffffff,
      align_h: hmUI.align.CENTER_H,
    });
    this.state.y += titleHeight + 20;

    if (this.state.item.attributes.media_duration && this.state.item.attributes.media_position) {
      this.createWidget(hmUI.widget.ARC, {
        x: DEVICE_WIDTH / 2 - DEVICE_WIDTH / 4,
        y: this.state.y,
        w: DEVICE_WIDTH / 2,
        h: DEVICE_WIDTH / 2,
        start_angle: 0,
        end_angle: 360,
        color: 0x262626,
        line_width: 7,
      });

      this.state.positionArc = this.createWidget(hmUI.widget.ARC, {
        x: DEVICE_WIDTH / 2 - DEVICE_WIDTH / 4,
        y: this.state.y,
        w: DEVICE_WIDTH / 2,
        h: DEVICE_WIDTH / 2,
        start_angle: -90,
        end_angle: 200,
        color: 0xffffff,
        line_width: 7,
      });
    }

    const playIconSize = 48;
    this.state.playButton = this.createWidget(hmUI.widget.IMG, {
      x: DEVICE_WIDTH / 2 - playIconSize / 2,
      y: this.state.y + DEVICE_WIDTH / 4 - playIconSize / 2,
      src: "play.png",
    });

    if (this.state.item.attributes.supported_features & 1) {
      //PAUSE  https://github.com/home-assistant/core/blob/e9705364a80fff9c18e2e24b0c0dceff0a71df6e/homeassistant/components/media_player/const.py#L179
      this.state.playButton.addEventListener(hmUI.event.CLICK_UP, (info) => {
        if (this.state.rendered) {
          this.doMediaAction(this.state.isPlaying ? "pause" : "play");
        }

        this.state.playButton.setProperty(hmUI.prop.MORE, {
          src: (this.state.isPlaying ? "pause" : "play") + ".png",
        });
      });
    }

    this.state.y += DEVICE_WIDTH / 2 + 30;

    if (this.state.item.attributes.media_title) {
      this.state.titleText = this.createWidget(hmUI.widget.TEXT, {
        x: 10,
        y: this.state.y,
        w: DEVICE_WIDTH - 20,
        h: 38,
        text: this.state.item.attributes.media_title,
        text_size: 21,
        color: 0xffffff,
        align_h: hmUI.align.CENTER_H,
      });
      this.state.y += 32;
    }

    if (this.state.item.attributes.media_artist) {
      this.state.artistText = this.createWidget(hmUI.widget.TEXT, {
        x: 10,
        y: this.state.y,
        w: DEVICE_WIDTH - 20,
        h: 34,
        text: this.state.item.attributes.media_artist,
        text_size: 19,
        color: 0xaaaaaa,
        align_h: hmUI.align.CENTER_H,
      });
      this.state.y += 32;
    }

    if (typeof this.state.item.attributes.volume_level === "number") {
      let volumeSliderButton = null;

      if (typeof this.state.item.attributes.is_volume_muted === "boolean") {
        volumeSliderButton = {
          image: "volume_off.png",
          onButtonToggle: (ctx, newValue) => {
            ctx.state.item.attributes.is_volume_muted = newValue

            messageBuilder.request(
              {
                method: "MEDIA_ACTION",
                entity_id: ctx.state.item.key,
                value: `{"is_volume_muted": ${newValue}}`,
                service: "volume_mute"
              });
          }
        }
      }

      let onSliderMove = (ctx, floatpos, isUserInput) => {
        logger.log("nativeslider input", floatpos)

        if (ctx.state.rendered && isUserInput) {
          messageBuilder.request(
            {
              method: "MEDIA_ACTION",
              entity_id: ctx.state.item.key,
              value: `{"volume_level": ${floatpos}}`,
              service: "volume_set"
            });
          ctx.state.volumeBar.setPosition(floatpos);
          ctx.state.item.attributes.volume_level = floatpos
        }
      };

      this.state.volumeSlider = new NativeSliderModal(onSliderMove, this,
        {
          stateImages: ["volume_min_1.png", "volume_min_2.png", "volume_mid.png", "volume_mid.png", "volume_max.png", "volume_max.png"],
          button: volumeSliderButton,
          backColor: 0x303030,
          frontColor: 0xf0f0f0
        })

      this.state.volumeBar = createProgressBar({
        x: 10,
        y: DEVICE_HEIGHT - 130,
        h: 24,
        w: DEVICE_WIDTH - 20,
        backColor: 0x262626,
        frontColor: 0xffffff,
        src: "volume_up.png",
        ctx: this,
        onClick: (ctx) => {
          if (!ctx.state.rendered) return
          ctx.router.showModal(ctx.state.volumeSlider)
          this.state.volumeSlider.setPosition(ctx.state.item.attributes.volume_level)
          this.state.volumeSlider.setButtonToggle(ctx.state.item.attributes.is_volume_muted)
        },
      });
      this.state.y += 12 * 2 + 20;
      this.addWidgets(this.state.volumeBar.components);
    }

    if (this.state.item.attributes.supported_features & 32) {
      //NEXT_TRACK  https://github.com/home-assistant/core/blob/e9705364a80fff9c18e2e24b0c0dceff0a71df6e/homeassistant/components/media_player/const.py#L179
      this.createWidget(hmUI.widget.BUTTON, {
        x: 0,
        y: DEVICE_HEIGHT - seekButtonsHeight,
        w: DEVICE_WIDTH,
        h: seekButtonsHeight,
        normal_src: "skip_next.png",
        press_src: "skip_next_pressed.png",
        click_func: () => {
          this.doMediaAction("next_track");
        },
      });
    }

    this.updateElementsData();
    this.setReloadTimer(10000);

    this.state.rendered = true;
  }
  onInit(param) {
    logger.log("onInit");
    logger.log("param", param);
    this.state.item = param;
  }
  onRender() {
    hmUI.setLayerScrolling(false);
    this.drawWait(this.state.item.title);
    this.getSensorInfo();
  }
  onDestroy() {
    this.destroyTimers();
  }
}

export default Index;
