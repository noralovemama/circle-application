"use strict";
const common_vendor = require("../../common/vendor.js");
const request_mock_user_index = require("./user/index.js");
const request_mock_circle_index = require("./circle/index.js");
const request_mock_circle_detail = require("./circle/detail.js");
const request_mock_circle_create = require("./circle/create.js");
const request_mock_circle_update = require("./circle/update.js");
const request_mock_user_profile = require("./user/profile.js");
const request_mock_user_refreshToken = require("./user/refresh-token.js");
const mockMap = {
  "circle/page": (params) => request_mock_circle_index.generateMockList(params),
  "circle/detail": (params) => request_mock_circle_detail.getCircleDetail(params),
  "circle/create": (params) => request_mock_circle_create.createCircle(params),
  "circle/update": (params) => request_mock_circle_update.updateCircle(params),
  "user/profile": () => request_mock_user_profile.getUserProfile(),
  "user/profile/create": (params) => request_mock_user_profile.createProfile(params),
  "user/profile/update": (params) => request_mock_user_profile.updateProfile(params),
  "token/refresh": (params) => request_mock_user_refreshToken.refreshToken(params),
  "code/send": (params) => request_mock_user_index.sendCode(params),
  "token/login": (params) => request_mock_user_index.login(params)
};
const findMockFunction = (url, params) => {
  common_vendor.index.__f__("log", "at request/mock/index.js:33", "[Mock] 查找处理函数:", url, params);
  const mockFn = mockMap[url];
  if (!mockFn) {
    common_vendor.index.__f__("log", "at request/mock/index.js:37", "[Mock] 未找到处理函数:", url);
    throw new Error(`未找到 mock 处理函数: ${url}`);
  }
  try {
    common_vendor.index.__f__("log", "at request/mock/index.js:42", "[Mock] 执行处理函数:", url, params);
    return mockFn(params);
  } catch (error) {
    common_vendor.index.__f__("error", "at request/mock/index.js:45", "[Mock] 处理函数执行错误:", error);
    throw error;
  }
};
exports.findMockFunction = findMockFunction;
//# sourceMappingURL=../../../.sourcemap/mp-weixin/request/mock/index.js.map
