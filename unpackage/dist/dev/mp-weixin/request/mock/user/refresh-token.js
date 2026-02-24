"use strict";
const refreshToken = async (data) => {
  if (!data.code) {
    return {
      code: 400,
      message: "缺少登录凭证"
    };
  }
  return {
    code: 0,
    message: "success",
    data: {
      token: "mock_token_" + Date.now(),
      expires: Date.now() + 72e5
      // 2小时后过期
    }
  };
};
exports.refreshToken = refreshToken;
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/request/mock/user/refresh-token.js.map
