import { gettext } from 'i18n'

AppSettingsPage({
  state: {
    entityList: [],
    props: {},
  },
  setState(props) {
    this.state.props = props;
    if (props.settingsStorage.getItem("entityList")) {
      this.state.entityList = JSON.parse(
        props.settingsStorage.getItem("entityList")
      );
    } else {
      this.state.entityList = [];
      console.log("Initialized");
    }
  },
  setItem() {
    const newStr = JSON.stringify(this.state.entityList);
    this.state.props.settingsStorage.setItem("entityList", newStr);
  },
  toggleEntity(key, val) {
    const newEntityList = this.state.entityList.map((_item) => {
      const item = _item;
      if (item.key === key) {
        item.value = val;
      }
      return item;
    });
    this.state.entityList = newEntityList;
    this.setItem();
  },
  moveEntityToTop(index) {
    entity = this.state.entityList[index];
    this.state.entityList = this.state.entityList.filter((_, ind) => {
      return ind !== index
    })
    this.state.entityList.unshift(entity);
    this.setItem()
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
    let entityList = [];
    this.state.entityList.forEach((item, i) => {
      if (
        !item.key.startsWith('light.') && 
        !item.key.startsWith('switch.') && 
        !item.key.startsWith('binary_sensor.') && 
        !item.key.startsWith('sensor.') && 
        !item.key.startsWith('media_player.') &&
        !item.key.startsWith('script.') &&
        !item.key.startsWith('automation.')
      ) {
        return;
      }
      entityList.push(
        View({ 
          style: { 
            display: 'flex', 
            borderBottom: "1px solid #eaeaea", 
            padding: "6px 0", 
            marginBottom: '6px' 
          }}, 
        [
          View({ 
            style: { 
              width: "70%", 
              overflow: "hidden" 
            }}, 
            Toggle({
              label: `${item.title} (${item.key})`,
              value: item.value,
              onChange: this.toggleEntity.bind(this, item.key),
            })
          ),
          View({ style: { flex: 1 }},
            Button({
              label: gettext('^'),
              style: {
                float: "right",
                top: '10px',
                minWidth: '32px',
                height: '10px',
                borderRadius: '60px',
                background: '#18BCF2',
                color: 'white'
              },
              onClick: () => {
                this.moveEntityToTop(i)
              }
            }),
          )
        ])
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
          label: "Refresh entities",
          async onClick() {
            props.settingsStorage.removeItem("entityList");
            props.settingsStorage.setItem("listFetchRandom", Math.random());
            return;
          },
        })
      ),
      Text({}, "Only the media player, light, switch, script, automation and (binary) " +  
      "sensor entities are supported for now:"),
      entityList.length > 0 &&
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
          entityList
        ),
    ]);
  },
});
