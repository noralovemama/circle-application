"use strict";
const common_vendor = require("../../../common/vendor.js");
const generateMockList = (params = {}) => {
  const current = parseInt(params == null ? void 0 : params.current) || 1;
  const size = parseInt(params == null ? void 0 : params.size) || 10;
  common_vendor.index.__f__("log", "at request/mock/circle/index.js:6", "[Mock] 生成数据，参数:", { current, size });
  const list = [];
  const startIndex = (current - 1) * size;
  const totalCount = 30;
  for (let i = 0; i < size; i++) {
    const id = startIndex + i;
    if (id >= totalCount)
      break;
    list.push({
      circleId: `circle_${id}`,
      circleName: `圈子${id + 1}`,
      ownerId: `user_${id + 1}`,
      ownerName: `用户${id + 1}`,
      avatar: "/static/default-avatar.png",
      memberCount: Math.floor(Math.random() * 100),
      description: `这是第${id + 1}个圈子的描述`,
      distance: `${Math.floor(Math.random() * 20)}公里`,
      createTime: "2024-01-15 19:00"
    });
  }
  common_vendor.index.__f__("log", "at request/mock/circle/index.js:29", "[Mock] 生成的列表:", {
    startIndex,
    listLength: list.length,
    firstItem: list[0],
    lastItem: list[list.length - 1]
  });
  return {
    code: 0,
    message: "success",
    data: {
      records: list,
      total: totalCount,
      size,
      current
    }
  };
};
exports.generateMockList = generateMockList;
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/request/mock/circle/index.js.map
