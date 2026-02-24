"use strict";
const common_vendor = require("../common/vendor.js");
const request_config = require("./config.js");
const request_mock_index = require("./mock/index.js");
require("../store/index.js");
const request = async (options) => {
  const { url, method = "GET", data, mock = false } = options;
  common_vendor.index.__f__("log", "at request/request.js:9", "[Request] 开始请求:", { url, method, data, mock });
  if (mock) {
    try {
      common_vendor.index.__f__("log", "at request/request.js:14", "[Mock] 开始查找 mock 函数:", url);
      const result = await request_mock_index.findMockFunction(url, data);
      common_vendor.index.__f__("log", "at request/request.js:16", "[Mock] 执行结果:", result);
      if (!result || typeof result !== "object") {
        common_vendor.index.__f__("error", "at request/request.js:20", "[Mock] 返回数据格式错误:", result);
        throw new Error("返回数据格式错误");
      }
      return result;
    } catch (error) {
      common_vendor.index.__f__("error", "at request/request.js:26", "[Mock] 处理错误:", error);
      throw error;
    }
  }
  try {
    const token = await common_vendor.index.getStorageSync("token") || "";
    const expireAt = await common_vendor.index.getStorageSync("expireAt") || "";
    const requestOptions = {
      url: `${request_config.config.baseUrl}${url}`,
      method,
      data,
      timeout: request_config.config.timeout,
      header: {
        "Content-Type": "application/json",
        // ...(token && { 'Authorization': `Bearer ${token}` })
        ...token && { "User-Token": JSON.stringify({ "openId": token, "expireAt": expireAt }) }
      }
    };
    const response = await common_vendor.index.request(requestOptions);
    const { status, message } = response == null ? void 0 : response.data;
    if (status == 10002) {
      common_vendor.index.redirectTo({
        url: "/pages/login/login"
      });
    } else if (status == 10001) {
      throw new Error(message);
    }
    return response.data;
  } catch (error) {
    common_vendor.index.__f__("error", "at request/request.js:58", "[Request] 请求错误:", error);
    throw error;
  }
};
exports.request = request;
//# sourceMappingURL=../../.sourcemap/mp-weixin/request/request.js.map
