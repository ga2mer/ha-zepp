export function assets(type) {
  return (path) => type + '/' + path
}

const TYPE = {
  'sensor': 1,
  'binary_sensor': 1,
  'switch': 3,
  'light': 3,
};

export function getScrollListDataConfig(dataList) {
  let previousType = '';
  let currentIndex = -1;
  const dataTypeConfig = []
  dataList.forEach((item, index) => {
    let currentType = item.type;
    if (currentType !== previousType) {
      currentIndex += 1;
      previousType = currentType;
      dataTypeConfig.push({
        start: index,
        type: TYPE[currentType],
      });
    }
    dataTypeConfig[currentIndex].end = index + 1;
  });
  const dataTypeConfigCount = dataTypeConfig.length;
  return { dataTypeConfig, dataTypeConfigCount };
}