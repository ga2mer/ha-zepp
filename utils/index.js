export function assets(type) {
  return (path) => type + "/" + path;
}

const TYPE = {
  sensor: 1,
  binary_sensor: 1,
  switch: 3,
  light: 3,
};

export function getScrollListDataConfig(dataList) {
  let previousType = "";
  let currentIndex = -1;
  const dataTypeConfig = [];
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

/**
 * 
 * @param {[Number]} color
 * @param {Number} percent float number
 * @returns {[Number]} result color
 */
export function shadeRGBColor(color, percent) {
  var t = percent < 0 ? 0 : 255
  var p = percent < 0 ? percent * -1 : percent
  var R = color[0]
  var G = color[1]
  var B = color[2]
  return [(Math.round((t - R) * p) + R), (Math.round((t - G) * p) + G), (Math.round((t - B) * p) + B)]
}


/**
 * 
 * @param {[Number]} color
 * @returns {Number} packed color
 */
export function rgbColorPack(color) {
  return color[0] << 16 | color[1] << 8 | color[2]
}

/**
 * 
 * @param {Number} color
 * @returns {[Number]} unpacked color
 */
export function rgbColorUnpack(color) {
  return [(color >> 16) & 0xFF, (color >> 8) & 0xFF, color & 0xFF]
}

/**
 * 
 * @param {[Number]} color1 
 * @param {[Number]} color2 
 * @param {Number} percent float number
 * @returns {[Number]} result color
 */
export function blendRGBColors(color1, color2, percent) {
  R = color1[0]
  G = color1[1]
  B = color1[2]
  R2 = color2[0]
  G2 = color2[1]
  B2 = color2[2]
  return [
    (Math.round((R2 - R) * percent) + R),
    (Math.round((G2 - G) * percent) + G),
    (Math.round((B2 - B) * percent) + B)
  ];
}

export function getEveryNth(arr, nth, start = 0) {
  const result = [];

  for (let index = start; index < arr.length; index += nth) {
    result.push(arr[index]);
  }

  return result;
}

export const generateRandomString = (length = 6) =>
  Math.random().toString(20).substr(2, length);
