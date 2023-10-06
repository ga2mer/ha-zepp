AppSettingsPage({
  state: {
    sensorsList: [],
    props: {},
  },
  setState(props) {
    this.state.props = props;
    if (props.settingsStorage.getItem("sensorsList")) {
      this.state.sensorsList = JSON.parse(
        props.settingsStorage.getItem("sensorsList")
      );
    } else {
      this.state.sensorsList = [];
      console.log("Initilized");
    }
  },
  setItem() {
    const newStr = JSON.stringify(this.state.sensorsList);
    this.state.props.settingsStorage.setItem("sensorsList", newStr);
  },
  clearSensors() {
		this.state.sensorsList = [];
		this.setItem();
	},
  toggleSensor(key, val) {
    const newSensorList = this.state.sensorsList.map((_item) => {
      const item = _item;
      if (item.key === key) {
        item.value = val;
      }
      return item;
    });
    this.state.sensorsList = newSensorList;
    this.setItem();
  },
  build(props) {
    this.setState(props);
    const textInputStyle = {
      marginTop: "4px",
      color: "#000000",
      fontSize: "15px",
      borderStyle: "solid",
      borderColor: "#000000",
      borderRadius: "2px",
      height: "28px",
      width: "50%",
      overflow: "hidden",
      borderWidth: "2px",
    };
    let sensorsList = [];
    this.state.sensorsList.forEach((item, i) => {
      if (
        !item.key.startsWith('light.') && 
        !item.key.startsWith('switch.') && 
        !item.key.startsWith('binary_sensor.') && 
        !item.key.startsWith('sensor.') && 
        !item.key.startsWith('media_player.') &&
        !item.key.startsWith('script.')
      ) {
        return;
      }
      sensorsList.push(
        View(
          {
            style: {
              borderBottom: "1px solid #eaeaea",
              padding: "6px 0",
              marginBottom: "6px",
              display: "flex",
              flexDirection: "row",
            },
          },
          Toggle({
            label: `${item.title} (${item.key})`,
            value: item.value,
            onChange: this.toggleSensor.bind(this, item.key),
          }),
        )
      );
    });
    return Section({}, [
      TextInput({
        label: 'Local HA instance address:',
        settingsKey: "localHAIP",
        subStyle: textInputStyle,
      }),
      TextInput({
        label: "External HA instance address:",
        settingsKey: "externalHAIP",
        subStyle: textInputStyle,
      }),
      TextInput({
        label: "Long access token:",
        settingsKey: "HAToken",
        subStyle: textInputStyle,
      }),
      Section(
        {},
        Button({
          label: "Refresh sensors",
          async onClick() {
            props.settingsStorage.removeItem("sensorsList");
            props.settingsStorage.setItem("listFetchRandom", Math.random());
            return;
          },
        })
      ),
      Text({}, "Only media players, light, switches and (binary) sensors are supported for now:"),
      sensorsList.length > 0 &&
        View(
          {
            style: {
              marginTop: "12px",
              padding: "10px",
              border: "1px solid #eaeaea",
              borderRadius: "6px",
              backgroundColor: "white",
            },
          },
          sensorsList
        ),
    ]);
  },
});
