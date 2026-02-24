"use strict";
const common_vendor = require("../../../common/vendor.js");
const updateCircle = (data) => {
  common_vendor.index.__f__("log", "at request/mock/circle/update.js:3", "[Mock] 更新圈子，参数:", data);
  if (Math.random() > 0.1) {
    return {
      code: 0,
      message: "success",
      data: {
        circleId: data.circleId,
        circleName: data.name,
        topic: data.theme,
        slogan: data.slogan,
        introduction: data.description,
        activityLocation: data.location,
        activityTime: data.date,
        latitude: data.latitude,
        longitude: data.longitude,
        updateTime: (/* @__PURE__ */ new Date()).toISOString()
      }
    };
  }
  throw new Error("模拟更新失败");
};
exports.updateCircle = updateCircle;
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/request/mock/circle/update.js.map
