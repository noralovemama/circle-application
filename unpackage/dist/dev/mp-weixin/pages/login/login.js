"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
const request_api_user = require("../../request/api/user.js");
require("../../store/index.js");
const _sfc_main = {
  setup() {
    const userStore = store_user.useUserStore();
    return {
      userStore
    };
  },
  data() {
    return {
      phone: "",
      validateCode: "",
      agreed: false,
      counting: false,
      countdown: 60,
      isPhoneValid: false,
      isRequesting: false
    };
  },
  methods: {
    validatePhone() {
      const phoneReg = /^1[3-9]\d{9}$/;
      this.isPhoneValid = phoneReg.test(this.phone);
    },
    async getCode() {
      if (!this.agreed) {
        common_vendor.index.showToast({
          title: "请先勾选用户协议",
          icon: "none"
        });
        return;
      }
      if (this.counting || !this.isPhoneValid || this.isRequesting)
        return;
      this.isRequesting = true;
      try {
        const res = await request_api_user.userApi.sendVerificationCode(this.phone);
        if (res.status === 1e4) {
          this.counting = true;
          this.countdown = 60;
          const timer = setInterval(() => {
            if (this.countdown > 0) {
              this.countdown--;
            } else {
              this.counting = false;
              clearInterval(timer);
            }
          }, 1e3);
          common_vendor.index.showToast({
            title: "验证码已发送",
            icon: "success"
          });
        } else {
          throw new Error(res.message);
        }
      } catch (error) {
        common_vendor.index.showToast({
          title: error.message || "发送失败",
          icon: "none"
        });
      } finally {
        this.isRequesting = false;
      }
    },
    async handleLogin() {
      if (!this.phone || !this.validateCode || !this.agreed)
        return;
      try {
        const { code } = await common_vendor.index.login();
        if (!code) {
          throw new Error("获取登录凭证失败");
        }
        const res = await request_api_user.userApi.loginWithCode(this.phone, this.validateCode, code);
        if (res.status === 1e4) {
          this.userStore.setTokenInfo({
            openId: res.data.openId,
            expireAt: res.data.expireAt
          });
          try {
            await this.userStore.getUserDetail();
          } catch (error) {
            common_vendor.index.__f__("log", "at pages/login/login.vue:170", "获取用户详情失败，可能是新用户:", error);
          }
          common_vendor.index.showToast({
            title: "登录成功",
            icon: "success"
          });
          setTimeout(() => {
            common_vendor.index.switchTab({
              url: "/pages/circle/circle"
            });
          }, 1500);
        } else {
          throw new Error(res.message);
        }
      } catch (error) {
        common_vendor.index.showToast({
          title: error.message || "登录失败",
          icon: "none"
        });
      }
    },
    handleAgreementChange(e) {
      this.agreed = e.detail.value.length > 0;
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.o([($event) => $data.phone = $event.detail.value, (...args) => $options.validatePhone && $options.validatePhone(...args)]),
    b: $data.phone,
    c: $data.validateCode,
    d: common_vendor.o(($event) => $data.validateCode = $event.detail.value),
    e: common_vendor.t($data.counting ? `${$data.countdown}s后重试` : "获取验证码"),
    f: !$data.isPhoneValid || $data.counting ? 1 : "",
    g: $data.isPhoneValid && !$data.counting ? 1 : "",
    h: $data.isRequesting ? 1 : "",
    i: common_vendor.o((...args) => $options.getCode && $options.getCode(...args)),
    j: $data.phone && $data.validateCode ? 1 : "",
    k: common_vendor.o((...args) => $options.handleLogin && $options.handleLogin(...args)),
    l: $data.agreed,
    m: common_vendor.o((...args) => $options.handleAgreementChange && $options.handleAgreementChange(...args))
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-e4e4508d"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/login/login.js.map
