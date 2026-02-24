"use strict";
const common_vendor = require("../../common/vendor.js");
const request_api_user = require("../../request/api/user.js");
const _sfc_main = {
  data() {
    return {
      targetUserId: null,
      // 要查看的用户ID，如果为null则查看当前用户
      userInfo: {
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
      }
    };
  },
  onLoad(options) {
    this.targetUserId = options.userId || null;
    this.loadUserProfile();
  },
  // 添加 onShow 生命周期，确保每次显示页面都重新加载数据
  onShow() {
    this.loadUserProfile();
  },
  methods: {
    goBack() {
      const pages = getCurrentPages();
      if (pages.length > 1) {
        common_vendor.index.navigateBack();
      } else {
        common_vendor.index.switchTab({
          url: "/pages/user/user"
        });
      }
    },
    goEdit() {
      common_vendor.index.navigateTo({
        url: "/pages/profile/profileNew"
      });
    },
    async loadUserProfile() {
      try {
        let userId;
        if (this.targetUserId) {
          userId = this.targetUserId;
        } else {
          userId = await common_vendor.index.getStorageSync("token");
        }
        const res = await request_api_user.userApi.getUserProfile(userId);
        if (res.status === 1e4 && res.data) {
          this.userInfo = {
            userName: res.data.userName,
            image: res.data.image,
            birthday: res.data.birthday || res.data.age,
            // 兼容旧数据
            company: res.data.company,
            position: res.data.position,
            school: res.data.school,
            introduction: res.data.introduction,
            personality: res.data.personality,
            question: res.data.question,
            answer: res.data.answer
          };
        }
      } catch (error) {
        common_vendor.index.__f__("log", "at pages/profile/profileDetail.vue:162", "加载用户信息失败:", error);
        common_vendor.index.showToast({
          title: "加载信息失败",
          icon: "none"
        });
      }
    },
    formatAge(birthday) {
      if (!birthday)
        return "未填写";
      let birthYear;
      if (typeof birthday === "string" && birthday.length === 8) {
        birthYear = parseInt(birthday.slice(0, 4));
      } else if (typeof birthday === "number" || !isNaN(birthday) && birthday.toString().length === 4) {
        birthYear = parseInt(birthday);
      } else {
        return birthday;
      }
      if (birthYear >= 1960 && birthYear < 1965)
        return "60后";
      if (birthYear >= 1965 && birthYear < 1970)
        return "65后";
      if (birthYear >= 1970 && birthYear < 1975)
        return "70后";
      if (birthYear >= 1975 && birthYear < 1980)
        return "75后";
      if (birthYear >= 1980 && birthYear < 1985)
        return "80后";
      if (birthYear >= 1985 && birthYear < 1990)
        return "85后";
      if (birthYear >= 1990 && birthYear < 1995)
        return "90后";
      if (birthYear >= 1995 && birthYear < 2e3)
        return "95后";
      if (birthYear >= 2e3 && birthYear < 2005)
        return "00后";
      if (birthYear >= 2005 && birthYear < 2010)
        return "05后";
      if (birthYear >= 2010 && birthYear < 2015)
        return "10后";
      if (birthYear >= 2015)
        return "15";
      return `${birthYear}年`;
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    b: $data.userInfo.image
  }, $data.userInfo.image ? {
    c: $data.userInfo.image
  } : {}, {
    d: common_vendor.t($data.userInfo.userName || "未设置昵称"),
    e: common_vendor.t($options.formatAge($data.userInfo.birthday || $data.userInfo.age)),
    f: common_vendor.t($data.userInfo.company || "未填写"),
    g: common_vendor.t($data.userInfo.school || "未填写"),
    h: common_vendor.t($data.userInfo.position || "未填写"),
    i: common_vendor.t($data.userInfo.personality || "未填写"),
    j: common_vendor.t($data.userInfo.introduction || "未填写"),
    k: common_vendor.t($data.userInfo.question || "未选择"),
    l: common_vendor.t($data.userInfo.answer || "未填写"),
    m: !$data.targetUserId
  }, !$data.targetUserId ? {
    n: common_vendor.o((...args) => $options.goEdit && $options.goEdit(...args))
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-c6f6b7fe"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/profile/profileDetail.js.map
