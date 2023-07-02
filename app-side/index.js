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

function roundToTwo(num) {
  return +(Math.round(num + "e+2") + "e-2");
}

async function getEnabledSensors() {
  const { body } = await request("/api/states");
  const sensors = typeof body === "string" ? JSON.parse(body) : body;
  const enabledSensors = getSensorsList()
    .filter((item) => item.value)
    .map((item) => {
      const actualSensor = sensors.find((it) => it.entity_id === item.key);
      if (!actualSensor) return null;

      let sensor = {
        key: actualSensor.entity_id,
        title: actualSensor.entity_id,
        state: actualSensor.state,
        type: actualSensor.entity_id.split(".")[0]
      };

      if (!isNaN(sensor.state)) {
        sensor.state = roundToTwo(sensor.state).toString()
      }

      if (actualSensor.attributes) {
        if (typeof actualSensor.attributes.friendly_name === "string") {
          sensor.title = actualSensor.attributes.friendly_name;
        }
        if (typeof actualSensor.attributes.unit_of_measurement === "string") {
          sensor.unit = actualSensor.attributes.unit_of_measurement;
        }
      }
      return sensor;
    })
    .filter((item) => item);
  return enabledSensors;
}

async function getSensorLog(entity_id) {
  console.log("getSensorLog", entity_id)
  const { body } = await request(`/api/history/period?minimal_response&no_attributes&significant_changes_only&filter_entity_id=${entity_id}`);
  const log = typeof body === "string" ? JSON.parse(body)[0] : body[0];
  let shortLog = log.map(e => e.state).slice(-15)
  console.log(shortLog)
  return shortLog
}

async function getSensorState(entity_id) {
  const { body } = await request(`/api/states/${entity_id}`);
  const actualSensor = typeof body === "string" ? JSON.parse(body) : body;
  if (!actualSensor) return null;

  sensor = {
    key: actualSensor.entity_id,
    title: actualSensor.entity_id,
    state: actualSensor.state,
    type: actualSensor.entity_id.split(".")[0],
    attributes: {}
  }

  if (!isNaN(actualSensor.state)) {
    sensor.state = roundToTwo(sensor.state).toString()
  }

  if (actualSensor.attributes) {
    if (typeof actualSensor.attributes.friendly_name === "string") {
      sensor.title = actualSensor.attributes.friendly_name;
    }
    if (typeof actualSensor.attributes.unit_of_measurement === "string") {
      sensor.unit = actualSensor.attributes.unit_of_measurement;
    }
  }

  if (sensor.type === "sensor") {
    sensor.attributes.device_class = actualSensor.attributes.device_class
    sensor.last_changed = actualSensor.last_changed
  }

  if (sensor.type === "light") {
    if (typeof actualSensor.attributes.brightness === "number")
      sensor.attributes.brightness = Math.round(actualSensor.attributes.brightness / 255 * 100)

    if (Array.isArray(actualSensor.attributes.rgb_color))
      sensor.attributes.rgb_color = actualSensor.attributes.rgb_color

    if (typeof actualSensor.attributes.effect === "string")
      sensor.attributes.effect = actualSensor.attributes.effect

    if (Array.isArray(actualSensor.attributes.effect_list))
      sensor.attributes.effect_list = actualSensor.attributes.effect_list

    sensor.attributes.supported_features = actualSensor.attributes.supported_features
  }

  if (sensor.type === "media_player") {

    if (typeof actualSensor.attributes.is_volume_muted === "boolean")
      sensor.attributes.is_volume_muted = actualSensor.attributes.is_volume_muted

    if (typeof actualSensor.attributes.volume_level === "number") {
      sensor.attributes.volume_level = actualSensor.attributes.volume_level
    }

    if (typeof actualSensor.attributes.media_position === "number")
      sensor.attributes.media_position = actualSensor.attributes.media_position

    if (typeof actualSensor.attributes.media_duration === "number")
      sensor.attributes.media_duration = actualSensor.attributes.media_duration

    if (typeof actualSensor.attributes.media_title === "string")
      sensor.attributes.media_title = actualSensor.attributes.media_title

    if (typeof actualSensor.attributes.media_artist === "string")
      sensor.attributes.media_artist = actualSensor.attributes.media_artist

    sensor.attributes.supported_features = actualSensor.attributes.supported_features
  }

  return sensor
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

      if (payload.method === "GET_SENSOR_LOG") {
        try {
          const sensorLog = await getSensorLog(payload.entity_id);
          ctx.response({ data: { result: sensorLog } });
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
