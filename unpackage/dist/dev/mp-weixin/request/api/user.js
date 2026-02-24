"use strict";
const common_vendor = require("../../common/vendor.js");
const request_request = require("../request.js");
const userApi = {
  // 刷新 token
  refreshToken: (data) => {
    return request_request.request({
      url: "token/refresh",
      method: "POST",
      data: { code: data.code },
      mock: false
    });
  },
  // 发送验证码
  sendVerificationCode: (phone) => {
    return request_request.request({
      url: "code/send",
      method: "POST",
      data: { phoneNumber: phone },
      mock: false
    });
  },
  // 验证码登录
  loginWithCode: (phone, validateCode, code) => {
    return request_request.request({
      url: "token/login",
      method: "POST",
      data: { phoneNumber: phone, validateCode, code },
      mock: false
    });
  },
  // 获取用户信息
  getUserProfile: (userId) => {
    common_vendor.index.__f__("log", "at request/api/user.js:36", "[API] 获取用户信息");
    const param = {
      userId
    };
    return request_request.request({
      url: "user/detail",
      method: "GET",
      data: param,
      mock: false
    });
  },
  // 创建用户信息
  createProfile: (data) => {
    common_vendor.index.__f__("log", "at request/api/user.js:50", "[API] 创建用户信息:", data);
    return request_request.request({
      url: "user/profile/create",
      method: "POST",
      data: {
        userName: data.userName,
        image: data.image,
        birthday: data.birthday,
        company: data.company,
        position: data.position,
        school: data.school,
        introduction: data.introduction,
        personality: data.personality,
        question: data.question,
        answer: data.answer
      },
      mock: true
    });
  },
  // 更新用户信息
  updateProfile: (data, userId, userName, image) => {
    common_vendor.index.__f__("log", "at request/api/user.js:72", "[API] 更新用户信息:", data);
    return request_request.request({
      url: "user/update",
      method: "POST",
      data: {
        image: data.image || image,
        userName: data.userName || userName,
        birthday: data.birthday,
        company: data.company,
        position: data.position,
        school: data.school,
        introduction: data.introduction,
        personality: data.personality,
        question: data.question,
        answer: data.answer,
        userId
      },
      mock: false
    });
  }
};
exports.userApi = userApi;
//# sourceMappingURL=../../../.sourcemap/mp-weixin/request/api/user.js.map
