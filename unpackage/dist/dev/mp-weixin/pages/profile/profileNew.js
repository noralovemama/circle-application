"use strict";
const common_vendor = require("../../common/vendor.js");
const request_api_user = require("../../request/api/user.js");
common_vendor.index.__f__("log", "at pages/profile/profileNew.vue:161", "profileNew页面已加载");
const _sfc_main = {
  data() {
    return {
      defaultNickname: "用户名XXX",
      tempUserInfo: {
        avatar: "",
        nickname: "",
        avatarBase64: ""
      },
      showNicknameTip: false,
      formData: {
        birthday: "",
        company: "",
        position: "",
        school: "",
        introduction: "",
        personality: "",
        question: "",
        answer: ""
      },
      birthdayDate: "",
      mbtiOptions: [
        "ISTJ",
        "ISFJ",
        "INFJ",
        "INTJ",
        "ISTP",
        "ISFP",
        "INFP",
        "INTP",
        "ESTP",
        "ESFP",
        "ENFP",
        "ENTP",
        "ESTJ",
        "ESFJ",
        "ENFJ",
        "ENTJ"
      ],
      mbtiIndex: 0,
      questionOptions: [
        "如果让别人记住你一个点，你希望是什么？",
        "你生命中最骄傲的一件事是什么？",
        "你最不能接受别人的什么行为？",
        "别人第一次见你，最常说的第一句话是什么？",
        "一句你经常对自己说的话？",
        "你觉得自己身上最矛盾的一点是什么？",
        "你最想摆脱的一个标签是什么？",
        "你曾经做过最疯狂的一件事？",
        "你人生中最想感谢的一个人是谁？为什么？",
        "如果明天就是世界末日，你今天会做什么？"
      ],
      questionIndex: 0,
      isSaving: false,
      isEdit: false
    };
  },
  onLoad() {
    this.loadUserProfile();
  },
  methods: {
    // 头像选择回调
    async onChooseAvatar(e) {
      if (e.detail.avatarUrl) {
        try {
          common_vendor.index.showLoading({
            title: "处理中..."
          });
          this.tempUserInfo.avatar = e.detail.avatarUrl;
          this.showNicknameTip = true;
          const base64 = await this.imageToBase64(e.detail.avatarUrl);
          this.tempUserInfo.avatarBase64 = base64;
          common_vendor.index.hideLoading();
        } catch (error) {
          common_vendor.index.hideLoading();
          common_vendor.index.__f__("error", "at pages/profile/profileNew.vue:235", "头像处理失败:", error);
          common_vendor.index.showToast({
            title: "头像设置失败",
            icon: "none"
          });
        }
      }
    },
    // 昵称变更回调
    async onNicknameChange(e) {
      const nickname = e.detail.value;
      if (nickname) {
        this.tempUserInfo.nickname = nickname;
        this.showNicknameTip = false;
        try {
          common_vendor.index.showLoading({
            title: "更新中..."
          });
          if (this.tempUserInfo.avatarBase64 && this.tempUserInfo.nickname) {
            await this.$store.dispatch("user/updateUserInfo", {
              ...this.userInfo,
              avatar: this.tempUserInfo.avatarBase64,
              nickname: this.tempUserInfo.nickname
            });
            common_vendor.index.hideLoading();
            common_vendor.index.showToast({
              title: "更新成功",
              icon: "success"
            });
          } else {
            common_vendor.index.hideLoading();
          }
        } catch (error) {
          common_vendor.index.hideLoading();
          common_vendor.index.__f__("error", "at pages/profile/profileNew.vue:274", "更新失败:", error);
          common_vendor.index.showToast({
            title: "更新失败",
            icon: "none"
          });
        }
      }
    },
    // 图片转 base64
    imageToBase64(filePath) {
      return new Promise((resolve, reject) => {
        common_vendor.index.getFileSystemManager().readFile({
          filePath,
          encoding: "base64",
          success: (res) => {
            resolve(`data:image/png;base64,${res.data}`);
          },
          fail: reject
        });
      });
    },
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
    async loadUserProfile() {
      try {
        const userId = await common_vendor.index.getStorageSync("token");
        const res = await request_api_user.userApi.getUserProfile(userId);
        if (res.status === 1e4 && res.data) {
          this.tempUserInfo.nickname = res.data.userName;
          this.tempUserInfo.avatarBase64 = res.data.image;
          this.formData = {
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
          this.isEdit = true;
          this.tempUserInfo.avatar = res.data.image;
          this.tempUserInfo.nickname = res.data.userName;
          this.birthdayDate = this.convertToDateString(res.data.birthday || res.data.age);
          this.mbtiIndex = this.mbtiOptions.indexOf(res.data.personality);
          this.questionIndex = this.questionOptions.indexOf(res.data.question);
        }
      } catch (error) {
        common_vendor.index.__f__("log", "at pages/profile/profileNew.vue:334", "用户未创建个人信息");
      }
    },
    onBirthdayChange(e) {
      this.birthdayDate = e.detail.value;
      this.formData.birthday = e.detail.value.replace(/-/g, "");
    },
    // 将birthday字段转换为日期选择器需要的格式
    convertToDateString(birthday) {
      if (!birthday)
        return "";
      if (birthday.length === 4) {
        return `${birthday}-01-01`;
      } else if (birthday.length === 8) {
        return `${birthday.slice(0, 4)}-${birthday.slice(4, 6)}-${birthday.slice(6, 8)}`;
      }
      return birthday;
    },
    // 格式化生日显示
    formatBirthdayDisplay() {
      if (!this.birthdayDate)
        return "";
      const date = new Date(this.birthdayDate);
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    },
    onMbtiChange(e) {
      this.mbtiIndex = e.detail.value;
      this.formData.personality = this.mbtiOptions[this.mbtiIndex];
    },
    onQuestionChange(e) {
      this.questionIndex = e.detail.value;
      this.formData.question = this.questionOptions[this.questionIndex];
    },
    validateForm() {
      if (!this.tempUserInfo.avatarBase64) {
        common_vendor.index.showToast({
          title: `请选择头像`,
          icon: "none"
        });
        return false;
      }
      if (!this.tempUserInfo.nickname) {
        common_vendor.index.showToast({
          title: `请填写用户名`,
          icon: "none"
        });
        return false;
      }
      const requiredFields = {
        nickname: "昵称",
        birthday: "出生年月",
        company: "所在公司",
        school: "毕业院校"
      };
      for (const [field, label] of Object.entries(requiredFields)) {
        if (field === "nickname") {
          if (!this.tempUserInfo.nickname) {
            common_vendor.index.showToast({
              title: `请填写${label}`,
              icon: "none"
            });
            return false;
          }
        } else {
          if (!this.formData[field]) {
            common_vendor.index.showToast({
              title: `请填写${label}`,
              icon: "none"
            });
            return false;
          }
        }
      }
      return true;
    },
    async saveProfile() {
      var _a, _b;
      if (!this.validateForm())
        return;
      if (this.isSaving)
        return;
      this.isSaving = true;
      try {
        const userId = await common_vendor.index.getStorageSync("token");
        const userName = (_a = this.tempUserInfo) == null ? void 0 : _a.nickname;
        const image = (_b = this.tempUserInfo) == null ? void 0 : _b.avatarBase64;
        const userProfileData = {
          userName,
          image,
          birthday: this.formData.birthday,
          company: this.formData.company,
          position: this.formData.position,
          school: this.formData.school,
          introduction: this.formData.introduction,
          personality: this.formData.personality,
          question: this.formData.question,
          answer: this.formData.answer
        };
        common_vendor.index.__f__("log", "at pages/profile/profileNew.vue:447", "提交的用户数据:", userProfileData);
        const res = await request_api_user.userApi.updateProfile(userProfileData, userId, userName, image);
        if (res.status === 1e4) {
          common_vendor.index.showToast({
            title: "保存成功",
            icon: "success"
          });
          setTimeout(() => {
            common_vendor.index.redirectTo({
              url: "/pages/profile/profileDetail?refresh=" + Date.now()
            });
          }, 500);
        }
      } catch (error) {
        common_vendor.index.showToast({
          title: error.message || "保存失败",
          icon: "none"
        });
      } finally {
        this.isSaving = false;
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    b: $data.tempUserInfo.avatar
  }, $data.tempUserInfo.avatar ? {
    c: $data.tempUserInfo.avatar
  } : {}, {
    d: common_vendor.o((...args) => $options.onChooseAvatar && $options.onChooseAvatar(...args)),
    e: $data.showNicknameTip ? "请输入昵称" : $data.defaultNickname,
    f: common_vendor.o((...args) => $options.onNicknameChange && $options.onNicknameChange(...args)),
    g: $data.showNicknameTip ? 1 : "",
    h: $data.tempUserInfo.nickname,
    i: common_vendor.o(($event) => $data.tempUserInfo.nickname = $event.detail.value),
    j: $data.showNicknameTip
  }, $data.showNicknameTip ? {} : {}, {
    k: $data.tempUserInfo.nickname,
    l: common_vendor.o(($event) => $data.tempUserInfo.nickname = $event.detail.value),
    m: common_vendor.t($options.formatBirthdayDisplay() || "请选择出生年月日"),
    n: $data.birthdayDate,
    o: common_vendor.o((...args) => $options.onBirthdayChange && $options.onBirthdayChange(...args)),
    p: $data.formData.company,
    q: common_vendor.o(($event) => $data.formData.company = $event.detail.value),
    r: $data.formData.school,
    s: common_vendor.o(($event) => $data.formData.school = $event.detail.value),
    t: $data.formData.position,
    v: common_vendor.o(($event) => $data.formData.position = $event.detail.value),
    w: common_vendor.t($data.formData.personality || "请选择MBTI类型"),
    x: $data.mbtiOptions,
    y: $data.mbtiIndex,
    z: common_vendor.o((...args) => $options.onMbtiChange && $options.onMbtiChange(...args)),
    A: $data.formData.introduction,
    B: common_vendor.o(($event) => $data.formData.introduction = $event.detail.value),
    C: common_vendor.t($data.formData.question || "请选择一个问题"),
    D: $data.questionOptions,
    E: $data.questionIndex,
    F: common_vendor.o((...args) => $options.onQuestionChange && $options.onQuestionChange(...args)),
    G: $data.formData.answer,
    H: common_vendor.o(($event) => $data.formData.answer = $event.detail.value),
    I: common_vendor.t($data.isSaving ? "保存中..." : "保存"),
    J: common_vendor.o((...args) => $options.saveProfile && $options.saveProfile(...args)),
    K: $data.isSaving
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-7d5a9145"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/profile/profileNew.js.map
