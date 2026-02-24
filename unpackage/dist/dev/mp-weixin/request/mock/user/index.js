"use strict";
const login = async (data) => {
  const { phone, code } = data;
  return {
    status: 1e4,
    message: "success",
    data: {
      openId: `user_${Date.now()}`,
      expireAt: Math.floor(Date.now() / 1e3) + 7200,
      userInfo: {
        phone,
        nickname: "测试用户",
        avatar: ""
      }
    }
  };
};
const sendCode = async (data) => {
  const { phoneNumber: phone } = data;
  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    throw new Error("手机号格式错误");
  }
  return {
    status: 1e4,
    message: "success",
    data: Date.now().toString()
  };
};
exports.login = login;
exports.sendCode = sendCode;
//# sourceMappingURL=../../../../.sourcemap/mp-weixin/request/mock/user/index.js.map
