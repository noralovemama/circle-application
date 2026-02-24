"use strict";
const common_vendor = require("../common/vendor.js");
const request_api_user = require("../request/api/user.js");
require("./index.js");
const useUserStore = common_vendor.defineStore("user", {
  state: () => ({
    token: common_vendor.index.getStorageSync("token") || "",
    expireAt: common_vendor.index.getStorageSync("expireAt") || "",
    userName: common_vendor.index.getStorageSync("userName") || "",
    userInfo: {
      userId: "",
      userName: "",
      image: "",
      birthday: "",
      company: "",
      position: "",
      school: "",
      introduction: "",
      personality: "",
      question: "",
      answer: ""
    },
    isLogin: false,
    isLoading: false
  }),
  actions: {
    async setTokenInfo({ openId, expireAt }) {
      if (openId) {
        common_vendor.index.setStorageSync("token", openId);
        this.token = openId;
      }
      if (expireAt) {
        common_vendor.index.setStorageSync("expireAt", expireAt);
        this.expireAt = expireAt;
      }
    },
    async getOpenId() {
      return common_vendor.index.getStorageSync("token");
    },
    async curUserName() {
      return common_vendor.index.getStorageSync("userName");
    },
    async setUserName(userName) {
      if (userName) {
        common_vendor.index.setStorageSync("userName", userName);
      }
    },
    // 检查登录状态
    async checkLoginStatus() {
      try {
        if (!this.token || !this.expireAt) {
          common_vendor.index.redirectTo({
            url: "/pages/login/login"
          });
        }
        const expired = this.isExpired(this.expireAt);
        if (expired) {
          common_vendor.index.redirectTo({
            url: "/pages/login/login"
          });
        }
        return false;
      } catch (error) {
        this.clearUserInfo();
        common_vendor.index.redirectTo({
          url: "/pages/login/login"
        });
        return false;
      }
    },
    // 定义一个函数来判断当前时间是否大于 expireAt
    isExpired(expireAt) {
      const currentTime = Date.now();
      const currentTimeInSeconds = Math.floor(currentTime / 1e3);
      return currentTimeInSeconds > expireAt;
    },
    // 清除用户信息
    clearUserInfo() {
      this.token = "";
      this.userInfo = {};
      this.isLogin = false;
      common_vendor.index.removeStorageSync("token");
      common_vendor.index.removeStorageSync("expireAt");
    },
    // 获取用户详情
    async getUserDetail() {
      try {
        const userId = this.token;
        if (!userId) {
          throw new Error("用户未登录");
        }
        const res = await request_api_user.userApi.getUserProfile(userId);
        if (res.status === 1e4 && res.data) {
          this.userInfo = {
            userId: res.data.userId || userId,
            userName: res.data.userName || "",
            image: res.data.image || "",
            birthday: res.data.birthday || res.data.age || "",
            // 兼容旧数据
            company: res.data.company || "",
            position: res.data.position || "",
            school: res.data.school || "",
            introduction: res.data.introduction || "",
            personality: res.data.personality || "",
            question: res.data.question || "",
            answer: res.data.answer || ""
          };
          this.isLogin = true;
          return this.userInfo;
        } else {
          throw new Error(res.message || "获取用户信息失败");
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at store/user.js:131", "获取用户详情失败:", error);
        this.isLogin = true;
        return null;
      }
    },
    // 确保用户信息完整（如果store中没有用户名或头像，则获取）
    async ensureUserInfo() {
      if (!this.userInfo.userName || !this.userInfo.image) {
        this.isLoading = true;
        try {
          const result = await this.getUserDetail();
          return result;
        } finally {
          this.isLoading = false;
        }
      }
      return this.userInfo;
    },
    // 更新用户信息
    async updateUserInfo(data) {
    }
  }
});
exports.useUserStore = useUserStore;
//# sourceMappingURL=../../.sourcemap/mp-weixin/store/user.js.map
