import { MessageBuilder } from "../shared/message";

const messageBuilder = new MessageBuilder();

function getEntityList() {
  return settings.settingsStorage.getItem("entityList")
    ? JSON.parse(settings.settingsStorage.getItem("entityList"))
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
  if (res.status < 200 || res.status > 204) {
    throw new Error("HTTP response code: " + res.status);
  }
  return res;
}

async function request(path, fetchParams) {
  const localHAIP = settings.settingsStorage.getItem("localHAIP");
  const externalHAIP = settings.settingsStorage.getItem("externalHAIP");
  const hasLocalIP = typeof localHAIP === "string";
  const hasExternalIP = typeof externalHAIP === "string";
  if (!hasLocalIP && !hasExternalIP) {
    throw new Error("No addresses to requests");
  }
  let error = "";
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
  throw new Error("Connection error:\n" + error);
}

async function getEnabledEntities() {
  const { body } = await request("/api/states");
  const entities = typeof body === "string" ? JSON.parse(body) : body;
  const enabledEntities = getEntityList()
    .filter((item) => item.value)
    .map((item) => {
      const actualEntity = entities.find((it) => it.entity_id === item.key);
      if (!actualEntity) return null;
      let title = actualEntity.entity_id;
      let state = actualEntity.state;
      if (actualEntity.attributes) {
        if (typeof actualEntity.attributes.friendly_name === "string") {
          title = actualEntity.attributes.friendly_name;
        }
        if (typeof actualEntity.attributes.unit_of_measurement === "string") {
          state += actualEntity.attributes.unit_of_measurement;
        }
      }
      return {
        key: actualEntity.entity_id,
        title,
        state,
        type: actualEntity.entity_id.split(".")[0],
      };
    })
    .filter((item) => item);
  return enabledEntities;
}

async function getEntityState(entity_id) {
  const { body } = await request(`/api/states/${entity_id}`);
  const entity = typeof body === "string" ? JSON.parse(body) : body;
  if (!entity) return null;

  let title = entity.entity_id;
  let state = entity.state;
  if (entity.attributes) {
    if (typeof entity.attributes.friendly_name === "string") {
      title = entity.attributes.friendly_name;
    }
    if (typeof entity.attributes.unit_of_measurement === "string") {
      state += entity.attributes.unit_of_measurement;
    }
  }

  actualEntity = {
    key: entity.entity_id,
    title,
    state,
    type: entity.entity_id.split(".")[0],
    attributes: {},
  };

  if (actualEntity.type === "light") {
    if (typeof entity.attributes.brightness === "number")
      actualEntity.attributes.brightness = Math.round(
        (entity.attributes.brightness / 255) * 100
      );

    if (Array.isArray(entity.attributes.rgb_color))
      actualEntity.attributes.rgb_color = entity.attributes.rgb_color;

    if (typeof entity.attributes.effect === "string")
      actualEntity.attributes.effect = entity.attributes.effect;

    if (Array.isArray(entity.attributes.effect_list))
      actualEntity.attributes.effect_list = entity.attributes.effect_list;

    actualEntity.attributes.supported_features =
      entity.attributes.supported_features;
  }

  if (actualEntity.type === "media_player") {
    if (typeof entity.attributes.volume_level === "number")
      actualEntity.attributes.volume_level = entity.attributes.volume_level;

    if (typeof entity.attributes.is_volume_muted === "boolean")
      actualEntity.attributes.is_volume_muted =
        entity.attributes.is_volume_muted;

    if (typeof entity.attributes.media_position === "number")
      actualEntity.attributes.media_position = entity.attributes.media_position;

    if (typeof entity.attributes.media_duration === "number")
      actualEntity.attributes.media_duration = entity.attributes.media_duration;

    if (typeof entity.attributes.media_title === "string")
      actualEntity.attributes.media_title = entity.attributes.media_title;

    if (typeof entity.attributes.media_artist === "string")
      actualEntity.attributes.media_artist = entity.attributes.media_artist;

    actualEntity.attributes.supported_features =
      entity.attributes.supported_features;
  }

  console.log(actualEntity);
  return actualEntity;
}

AppSideService({
  onInit() {
    console.log("onInit");
    messageBuilder.listen(() => {});
    settings.settingsStorage.addListener(
      "change",
      async ({ key, newValue, oldValue }) => {
        if (key === "entityList") {
          const enabledEntities = await getEnabledEntities();
          messageBuilder.call({
            action: "listUpdate",
            value: enabledEntities,
          });
        }
        if (key === "listFetchRandom") {
          const { body } = await request("/api/states");
          const res = typeof body === "string" ? JSON.parse(body) : body;
          const entityList = res.map((item) => {
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
          const newStr = JSON.stringify(entityList);
          settings.settingsStorage.setItem("entityList", newStr);
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
      if (payload.method == "PRESS_BUTTON") {
        let state = "off";
        if (payload.current_state === "off") {
          state = "on";
        }
        await request(`/api/services/${payload.service}/turn_${state}`, {
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
            ...JSON.parse(payload.value),
          }),
        });
        ctx.response({ data: { result: [] } });
      }
      if (payload.method === "MEDIA_ACTION") {
        await request(`/api/services/media_player/${payload.service}`, {
          method: "POST",
          body: JSON.stringify({
            entity_id: payload.entity_id,
            ...JSON.parse(payload.value),
          }),
        });
        ctx.response({ data: { result: [] } });
      }
      if (payload.method === "GET_ENTITY_LIST") {
        try {
          const enabledEntities = await getEnabledEntities();
          ctx.response({ data: { result: enabledEntities } });
        } catch (e) {
          ctx.response({ data: { error: e.message } });
        }
      }
      if (payload.method === "GET_ENTITY") {
        try {
          const entityState = await getEntityState(payload.entity_id);
          ctx.response({ data: { result: entityState } });
        } catch (e) {
          ctx.response({ data: { error: e.message } });
        }
      }
      if (payload.method === "GET_UPDATE_SENSORS_STATE") {
        const state =
          settings.settingsStorage.getItem("updateSensorsBool") === "true";
        ctx.response({ data: { result: state } });
      }
      if (payload.method === "UPDATE_SENSORS") {
        const attributes = payload.attributes;
        try {
          // send request and await in case of caught error
          await request(
            `/api/states/sensor.${payload.device_id}_${payload.sensor_name}`,
            {
              method: "POST",
              body: JSON.stringify({
                state: payload.state,
                attributes,
              }),
            }
          );
          ctx.response({ data: { result: [] } });
        } catch (e) {
          ctx.response({ data: { error: e.message } });
        }
      }
    });
  },

  async onRun() {
    console.log("onRun");
  },

  onDestroy() {},
});
