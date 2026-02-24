"use strict";
const common_vendor = require("../../../common/vendor.js");
const createCircle = (data) => {
  common_vendor.index.__f__("log", "at request/mock/circle/create.js:2", "[Mock] 创建圈子，参数:", data);
  if (Math.random() > 0.1) {
    return {
      code: 0,
      message: "success",
      data: {
        circleId: `circle_${Date.now()}`,
        ...data
      }
    };
  }
  throw new Error("模拟创建失败");
};
exports.createCircle = createCircle;
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/request/mock/circle/create.js.map
