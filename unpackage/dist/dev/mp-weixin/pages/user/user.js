"use strict";
const common_vendor = require("../../common/vendor.js");
const store_user = require("../../store/user.js");
const _sfc_main = {
  setup() {
    const userStore = store_user.useUserStore();
    return {
      userStore
    };
  },
  data() {
    return {
      defaultNickname: "用户名XXX",
      tempUserInfo: {
        avatar: "",
        nickname: ""
      },
      showNicknameTip: false
    };
  },
  onLoad() {
    this.loadUserProfile();
  },
  onShow() {
    this.loadUserProfile();
  },
  methods: {
    async loadUserProfile() {
      try {
        if (this.userStore.userInfo.userName) {
          this.defaultNickname = this.userStore.userInfo.userName;
          this.tempUserInfo.nickname = this.userStore.userInfo.userName;
          this.tempUserInfo.avatar = this.userStore.userInfo.image;
          return;
        }
        await this.userStore.getUserDetail();
        if (this.userStore.userInfo.userName) {
          this.defaultNickname = this.userStore.userInfo.userName;
          this.tempUserInfo.nickname = this.userStore.userInfo.userName;
          this.tempUserInfo.avatar = this.userStore.userInfo.image;
        }
      } catch (error) {
        common_vendor.index.__f__("log", "at pages/user/user.vue:93", "用户未创建个人信息");
      }
    },
    goBack() {
      const pages = getCurrentPages();
      if (pages.length > 1) {
        common_vendor.index.navigateBack();
      }
    },
    navigateTo(url) {
      common_vendor.index.__f__("log", "at pages/user/user.vue:105", "跳转到:", url);
      common_vendor.index.navigateTo({
        url,
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/user/user.vue:109", "跳转失败:", err);
          common_vendor.index.showToast({
            title: "页面跳转失败",
            icon: "none"
          });
        }
      });
    },
    handleMyCircles() {
      common_vendor.index.reLaunch({
        url: "/pages/circle/circle?type=my"
      });
    },
    navigateToProfileDetail() {
      common_vendor.index.__f__("log", "at pages/user/user.vue:126", "跳转到profileDetail页面");
      try {
        common_vendor.index.navigateTo({
          url: "/pages/profile/profileDetail",
          success: () => {
            common_vendor.index.__f__("log", "at pages/user/user.vue:132", "跳转成功");
          },
          fail: (err) => {
            common_vendor.index.__f__("error", "at pages/user/user.vue:135", "navigateTo失败:", err);
            common_vendor.index.showToast({
              title: "页面跳转失败，请检查页面配置",
              icon: "none"
            });
          }
        });
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/user/user.vue:144", "跳转异常:", error);
        common_vendor.index.showToast({
          title: "跳转异常",
          icon: "none"
        });
      }
    }
  }
};
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  _easycom_uni_icons2();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  _easycom_uni_icons();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    b: $data.tempUserInfo.avatar
  }, $data.tempUserInfo.avatar ? {
    c: $data.tempUserInfo.avatar
  } : {}, {
    d: $data.showNicknameTip ? "请输入昵称" : $data.defaultNickname,
    e: $data.showNicknameTip ? 1 : "",
    f: $data.tempUserInfo.nickname,
    g: common_vendor.o(($event) => $data.tempUserInfo.nickname = $event.detail.value),
    h: $data.showNicknameTip
  }, $data.showNicknameTip ? {} : {}, {
    i: common_vendor.p({
      type: "right",
      size: "16",
      color: "#999"
    }),
    j: common_vendor.o((...args) => $options.navigateToProfileDetail && $options.navigateToProfileDetail(...args)),
    k: common_vendor.p({
      type: "right",
      size: "16",
      color: "#999"
    }),
    l: common_vendor.o((...args) => $options.handleMyCircles && $options.handleMyCircles(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-0f7520f0"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/user/user.js.map
