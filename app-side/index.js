import { MessageBuilder } from "../shared/message";

const messageBuilder = new MessageBuilder();

function getSensorsList() {
  return settings.settingsStorage.getItem("sensorsList")
    ? JSON.parse(settings.settingsStorage.getItem("sensorsList"))
    : [];
}

async function fetchRequest(url, path, fetchParams = {}) {
  const token = settings.settingsStorage.getItem("HAToken");
  const res = await fetch({
    url: new URL(path, url).toString(),
    method: "GET",
    ...fetchParams,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...fetchParams.headers,
    },
  });
  return res;
}

async function request(path, fetchParams) {
  const localHAIP = settings.settingsStorage.getItem("localHAIP");
  const externalHAIP = settings.settingsStorage.getItem("externalHAIP");
  const hasLocalIP = typeof localHAIP === "string";
  const hasExternalIP = typeof externalHAIP === "string";
  if (!hasLocalIP && !hasExternalIP) {
    throw new Error('No addresses to requests');
  }
  let error;
  if (hasLocalIP) {
    try {
      const res = await fetchRequest(localHAIP, path, fetchParams);
      return res;
    } catch (e) {
      error = e;
    }
  }
  if (hasExternalIP) {
    try {
      const res = await fetchRequest(externalHAIP, path, fetchParams);
      return res;
    } catch (e) {
      error = e;
    }
  }
  throw new Error('Connection error');
}

async function getEnabledSensors() {
  const { body } = await request("/api/states");
  const sensors = typeof body === "string" ? JSON.parse(body) : body;
  const enabledSensors = getSensorsList()
    .filter((item) => item.value)
    .map((item) => {
      const actualSensor = sensors.find((it) => it.entity_id === item.key);
      if (!actualSensor) return null;
      let title = actualSensor.entity_id;
      let state = actualSensor.state;
      if (actualSensor.attributes) {
        if (typeof actualSensor.attributes.friendly_name === "string") {
          title = actualSensor.attributes.friendly_name;
        }
        if (typeof actualSensor.attributes.unit_of_measurement === "string") {
          state += actualSensor.attributes.unit_of_measurement;
        }
      }
      return {
        key: actualSensor.entity_id,
        title,
        state,
        type: actualSensor.entity_id.split(".")[0]
      };
    })
    .filter((item) => item);
  return enabledSensors;
}

async function getSensorState(entity_id) {
  const { body } = await request(`/api/states/${entity_id}`);
  const sensor = typeof body === "string" ? JSON.parse(body) : body;
  if (!sensor) return null;

  let title = sensor.entity_id;
  let state = sensor.state;
  if (sensor.attributes) {
    if (typeof sensor.attributes.friendly_name === "string") {
      title = sensor.attributes.friendly_name;
    }
    if (typeof sensor.attributes.unit_of_measurement === "string") {
      state += sensor.attributes.unit_of_measurement;
    }
  }

  actualSensor = {
    key: sensor.entity_id,
    title,
    state,
    type: sensor.entity_id.split(".")[0],
    attributes: {}
  }

  if (actualSensor.type === "light") {
    if (typeof sensor.attributes.brightness === "number")
      actualSensor.attributes.brightness = Math.round(sensor.attributes.brightness / 255 * 100)

    if (Array.isArray(sensor.attributes.rgb_color))
      actualSensor.attributes.rgb_color = sensor.attributes.rgb_color

    if (typeof sensor.attributes.effect === "string")
      actualSensor.attributes.effect = sensor.attributes.effect

    if (Array.isArray(sensor.attributes.effect_list))
      actualSensor.attributes.effect_list = sensor.attributes.effect_list

    actualSensor.attributes.supported_features = sensor.attributes.supported_features
  }

  if (actualSensor.type === "media_player") {

    if (typeof sensor.attributes.is_volume_muted === "boolean")
      actualSensor.attributes.is_volume_muted = sensor.attributes.is_volume_muted

    if (typeof sensor.attributes.volume_level === "number") {
      actualSensor.attributes.volume_level = sensor.attributes.volume_level
    }

    if (typeof sensor.attributes.media_position === "number")
      actualSensor.attributes.media_position = sensor.attributes.media_position

    if (typeof sensor.attributes.media_duration === "number")
      actualSensor.attributes.media_duration = sensor.attributes.media_duration

    if (typeof sensor.attributes.media_title === "string")
      actualSensor.attributes.media_title = sensor.attributes.media_title

    if (typeof sensor.attributes.media_artist === "string")
      actualSensor.attributes.media_artist = sensor.attributes.media_artist

    actualSensor.attributes.supported_features = sensor.attributes.supported_features
  }

  return actualSensor
}

AppSideService({
  onInit() {
    console.log("onInit");
    messageBuilder.listen(() => { });
    settings.settingsStorage.addListener(
      "change",
      async ({ key, newValue, oldValue }) => {
        if (key === "sensorsList") {
          const enabledSensors = await getEnabledSensors();
          messageBuilder.call({
            action: "listUpdate",
            value: enabledSensors,
          });
        }
        if (key === "listFetchRandom") {
          const { body } = await request("/api/states");
          const res = typeof body === "string" ? JSON.parse(body) : body;
          const sensorsList = res.map((item) => {
            let title = item.entity_id;
            if (
              item.attributes &&
              typeof item.attributes.friendly_name === "string"
            ) {
              title = item.attributes.friendly_name;
            }
            return {
              key: item.entity_id,
              title,
            };
          });
          const newStr = JSON.stringify(sensorsList);
          settings.settingsStorage.setItem("sensorsList", newStr);
        }
      }
    );
    messageBuilder.on("request", async (ctx) => {
      const payload = messageBuilder.buf2Json(ctx.request.payload);
      if (payload.method === "TOGGLE_SWITCH") {
        let state = "off";
        let service = "switch";
        if (payload.value) {
          state = "on";
        }
        if (payload.service) {
          service = payload.service;
        }
        await request(`/api/services/${service}/turn_${state}`, {
          method: "POST",
          body: JSON.stringify({
            entity_id: payload.entity_id,
          }),
        });
        ctx.response({ data: { result: [] } });
      }
      if (payload.method === "LIGHT_SET") {
        await request(`/api/services/${payload.service}/turn_on`, {
          method: "POST",
          body: JSON.stringify({
            entity_id: payload.entity_id,
            ...JSON.parse(payload.value)
          }),
        });
        ctx.response({ data: { result: [] } });
      }
      if (payload.method === "MEDIA_ACTION") {
        await request(`/api/services/media_player/${payload.service}`, {
          method: "POST",
          body: JSON.stringify({
            entity_id: payload.entity_id,
            ...JSON.parse(payload.value)
          }),
        });
        ctx.response({ data: { result: [] } });
      }
      if (payload.method === "GET_SENSORS_LIST") {
        try {
          const enabledSensors = await getEnabledSensors();
          ctx.response({ data: { result: enabledSensors } });
        } catch (e) {
          ctx.response({ data: { error: e.message } });
        }
      }

      if (payload.method === "GET_SENSOR") {
        try {
          const sensorState = await getSensorState(payload.entity_id);
          ctx.response({ data: { result: sensorState } });
        } catch (e) {
          ctx.response({ data: { error: e.message } });
        }
      }
    });
  },

  async onRun() {
    console.log("onRun");
  },

  onDestroy() { },
});
