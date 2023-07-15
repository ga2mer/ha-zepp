import { gettext } from 'i18n';

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
      margin: "5px 10px",
      color: "#000000",
      fontSize: "15px",
      borderStyle: "solid",
      borderColor: "#000000",
      borderRadius: "2px",
      height: "28px",
      overflow: "hidden",
      borderWidth: "2px",
    };
    const labelStyle = {
      margin: "5px 10px"
    };

    let sensorsList = [];

    const supportedTypes = ['light', 'switch', 'binary_sensor', 'sensor', 'media_player']
    var filteredSensors = this.state.sensorsList.filter((item) => supportedTypes.includes(item.key.split('.')[0]))

    var grouped = filteredSensors.reduce((arr, item) => {
      arr[item.key.split('.')[0]] = (arr[item.key.split('.')[0]] || []).concat(item);
      return arr;
    }, {})

    for (const key in grouped) {
      let sensorGroup = [];

      let keytext = gettext(key)
      sensorGroup.push(
        Text(
          {
            align: "center",
            bold: true
          }, keytext)
      )

      grouped[key].forEach((item) => {
        sensorGroup.push(
          View(
            {
              style: {
                borderBottom: "1px solid #cdcdcd",
                padding: "6px 0",
                marginBottom: "6px",
              },
            },
            [
              Toggle({
                label: item.title,
                value: item.value,
                onChange: this.toggleSensor.bind(this, item.key),
              }),
              Text({
                style: {
                  fontSize: "12px"
                }
              },
                item.key.split(".")[1])
            ]
          )
        )
      })

      sensorsList.push(View({
        style: {
          padding: "10px",
          marginBottom: "10px",
          border: "black",
          borderRadius: "15px",
          borderWidth: "1px",
          borderStyle: "solid"
        }
      }, sensorGroup))
    }

    return Section({}, [
      TextInput({
        label: gettext('localhaaddr'),
        settingsKey: "localHAIP",
        subStyle: textInputStyle,
        labelStyle,
        placeholder: 'http://192.168.0.13:8123',
      }),
      TextInput({
        label: gettext('exthaaddr'),
        settingsKey: "externalHAIP",
        subStyle: textInputStyle,
        labelStyle,
        placeholder: 'https://your-ha-instance.com',
      }),
      TextInput({
        label: gettext("llatoken"),
        settingsKey: "HAToken",
        subStyle: textInputStyle,
        labelStyle,
      }),

      Section(
        {},
        Button({
          style: {
            margin: "10px"
          },
          label: gettext("sensrefresh"),
          async onClick() {
            props.settingsStorage.removeItem("sensorsList");
            props.settingsStorage.setItem("listFetchRandom", Math.random());
            return;
          },
        })
      ),
      Text({
        style: labelStyle
      },
        gettext("supportedentities")),
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
