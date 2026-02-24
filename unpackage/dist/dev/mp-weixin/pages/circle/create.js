"use strict";
const common_vendor = require("../../common/vendor.js");
const request_api_circle = require("../../request/api/circle.js");
require("../../store/index.js");
const store_user = require("../../store/user.js");
const store_circle = require("../../store/circle.js");
const _sfc_main = {
  data() {
    return {
      circleId: "",
      userId: "",
      isEdit: false,
      formData: {
        circleName: "",
        money: "",
        introduction: "",
        location: "",
        address: "",
        latitude: "",
        longitude: "",
        activityDate: "",
        activityTime: ""
      },
      longitude: "",
      latitude: "",
      isSaving: false,
      todayDate: "",
      // 今天的日期，用于限制日期选择
      currentTime: ""
      // 当前时间，用于限制时间选择
    };
  },
  async onLoad(options) {
    this.userStore = store_user.useUserStore();
    this.circleStore = store_circle.useCircleStore();
    const now = /* @__PURE__ */ new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hour = String(now.getHours()).padStart(2, "0");
    const minute = String(now.getMinutes()).padStart(2, "0");
    this.todayDate = `${year}-${month}-${day}`;
    this.currentTime = `${hour}:${minute}`;
    const userInfoLoaded = await this.loadUserProfile();
    if (!userInfoLoaded) {
      return;
    }
    if (options.circleId) {
      this.circleId = options.circleId;
      this.isEdit = true;
      await this.loadCircleData();
    } else {
      const hour2 = String(now.getHours()).padStart(2, "0");
      const minute2 = String(now.getMinutes()).padStart(2, "0");
      this.formData.activityDate = `${year}-${month}-${day}`;
      this.formData.activityTime = `${hour2}:${minute2}`;
    }
  },
  methods: {
    goBack() {
      const pages = getCurrentPages();
      if (pages.length > 1) {
        common_vendor.index.navigateBack();
      } else {
        common_vendor.index.switchTab({
          url: "/pages/circle/circle"
        });
      }
    },
    async loadUserProfile() {
      try {
        await this.userStore.ensureUserInfo();
        const userInfo = this.userStore.userInfo;
        if (!userInfo.userName || !userInfo.image) {
          common_vendor.index.showToast({
            title: "请先完善个人信息",
            icon: "none"
          });
          setTimeout(() => {
            common_vendor.index.switchTab({
              url: "/pages/user/user"
            });
          }, 1500);
          return false;
        }
        return true;
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/circle/create.vue:185", "加载用户信息失败:", error);
        common_vendor.index.showToast({
          title: "加载用户信息失败",
          icon: "none"
        });
        return false;
      }
    },
    async loadCircleData() {
      if (common_vendor.index.getSystemInfoSync().platform === "devtools") {
        common_vendor.index.__f__("log", "at pages/circle/create.vue:196", "模拟器环境，使用默认位置信息");
        const longitude = 116.24145697699653;
        const latitude = 39.93208468967014;
        await this.loadCircleDataReal(longitude, latitude);
        return;
      }
      common_vendor.index.getLocation({
        type: "gcj02",
        success: async ({
          longitude,
          latitude
        }) => {
          await this.loadCircleDataReal(longitude, latitude);
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/circle/create.vue:213", "获取位置失败：", err);
        }
      });
    },
    async loadCircleDataReal(longitude, latitude) {
      try {
        this.userId = await common_vendor.index.getStorageSync("token");
        const res = await request_api_circle.circleApi.getCircleDetail(this.circleId, this.userId, longitude, latitude);
        if (res.status === 1e4) {
          const {
            data
          } = res;
          const timestamp = data.activityTime;
          const dateObj = new Date(timestamp);
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, "0");
          const day = String(dateObj.getDate()).padStart(2, "0");
          const date = `${year}-${month}-${day}`;
          const hours = String(dateObj.getHours()).padStart(2, "0");
          const minutes = String(dateObj.getMinutes()).padStart(2, "0");
          const time = `${hours}:${minutes}`;
          this.formData = {
            circleName: data.circleName,
            introduction: data.introduction,
            location: data.activityLocation,
            latitude: data.latitude,
            longitude: data.longitude,
            activityTime: time,
            activityDate: date,
            money: data.money ? data.money.toString() : ""
          };
          this.validateEditDateTime();
        }
      } catch (error) {
        common_vendor.index.showToast({
          title: "加载数据失败",
          icon: "none"
        });
      }
    },
    openMap() {
      common_vendor.index.chooseLocation({
        success: (res) => {
          common_vendor.index.__f__("info", "at pages/circle/create.vue:268", "选择位置：", res);
          this.formData.location = res.address;
          this.formData.address = res.address;
          this.formData.latitude = res.latitude;
          this.formData.longitude = res.longitude;
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/circle/create.vue:275", "选择位置失败：", err);
          {
            const mockLocation = {
              name: "杭州市西湖区黄龙时代广场",
              address: "浙江省杭州市西湖区黄龙时代广场B座",
              latitude: 30.274085,
              longitude: 120.13802
            };
            this.formData.location = mockLocation.address;
            this.formData.address = mockLocation.address;
            this.formData.latitude = mockLocation.latitude;
            this.formData.longitude = mockLocation.longitude;
          }
        }
      });
    },
    onMoneyInput(e) {
      let value = e.detail.value;
      value = value.replace(/[^\d]/g, "");
      if (!value || value.trim() === "") {
        this.formData.money = "";
        return;
      }
      const numValue = parseInt(value) || 0;
      this.formData.money = numValue.toString();
    },
    onMoneyBlur(e) {
      const value = e.detail.value;
      if (!value || value.trim() === "") {
        common_vendor.index.showToast({
          title: "请填写预算金额",
          icon: "none",
          duration: 1500
        });
        return;
      }
      const numValue = parseInt(value);
      if (isNaN(numValue) || numValue < 0) {
        common_vendor.index.showToast({
          title: "请输入有效的预算金额",
          icon: "none",
          duration: 1500
        });
        return;
      }
    },
    onActivityDateChange(e) {
      const selectedDate = e.detail.value;
      this.formData.activityDate = selectedDate;
      if (selectedDate === this.todayDate) {
        if (this.formData.activityTime && this.formData.activityTime < this.currentTime) {
          const now = /* @__PURE__ */ new Date();
          const futureTime = new Date(now.getTime() + 60 * 60 * 1e3);
          const hours = String(futureTime.getHours()).padStart(2, "0");
          const minutes = String(futureTime.getMinutes()).padStart(2, "0");
          this.formData.activityTime = `${hours}:${minutes}`;
          common_vendor.index.showToast({
            title: "时间已自动调整为1小时后",
            icon: "none",
            duration: 2e3
          });
        }
        this.validateCurrentDateTime();
      }
    },
    onActivityTimeChange(e) {
      this.formData.activityTime = e.detail.value;
      if (this.formData.activityDate === this.todayDate) {
        this.validateCurrentDateTime();
      }
    },
    // 验证当前日期时间是否合理（不能是过去的时间）
    validateCurrentDateTime() {
      if (this.formData.activityDate === this.todayDate && this.formData.activityTime) {
        const now = /* @__PURE__ */ new Date();
        const selectedDateTime = /* @__PURE__ */ new Date(`${this.formData.activityDate}T${this.formData.activityTime}:00`);
        if (selectedDateTime <= now) {
          const futureTime = new Date(now.getTime() + 60 * 60 * 1e3);
          const hours = String(futureTime.getHours()).padStart(2, "0");
          const minutes = String(futureTime.getMinutes()).padStart(2, "0");
          this.formData.activityTime = `${hours}:${minutes}`;
          common_vendor.index.showToast({
            title: "活动时间不能是过去，已自动调整",
            icon: "none",
            duration: 2e3
          });
        }
      }
    },
    // 获取时间选择器的最小时间
    getMinTime() {
      if (this.formData.activityDate === this.todayDate) {
        return this.currentTime;
      }
      return "00:00";
    },
    // 编辑模式下验证加载的日期时间
    validateEditDateTime() {
      if (this.formData.activityDate && this.formData.activityTime) {
        const now = /* @__PURE__ */ new Date();
        const activityDateTime = /* @__PURE__ */ new Date(`${this.formData.activityDate}T${this.formData.activityTime}:00`);
        if (activityDateTime <= now) {
          const futureTime = new Date(now.getTime() + 60 * 60 * 1e3);
          const year = futureTime.getFullYear();
          const month = String(futureTime.getMonth() + 1).padStart(2, "0");
          const day = String(futureTime.getDate()).padStart(2, "0");
          const hours = String(futureTime.getHours()).padStart(2, "0");
          const minutes = String(futureTime.getMinutes()).padStart(2, "0");
          this.formData.activityDate = `${year}-${month}-${day}`;
          this.formData.activityTime = `${hours}:${minutes}`;
          common_vendor.index.showModal({
            title: "活动时间调整",
            content: "原活动时间已过期，已自动调整为当前时间后1小时。您可以重新选择合适的时间。",
            showCancel: false,
            confirmText: "知道了"
          });
        }
      }
    },
    updatePreview() {
    },
    async saveCircle() {
      const requiredFields = {
        circleName: "圈子名称",
        money: "预算",
        introduction: "圈子描述",
        location: "位置",
        activityTime: "活动时间",
        activityDate: "活动日期"
      };
      for (const [field, label] of Object.entries(requiredFields)) {
        if (!this.formData[field]) {
          common_vendor.index.showToast({
            title: `请填写${label}`,
            icon: "none"
          });
          return;
        }
      }
      if (!this.formData.money || this.formData.money.trim() === "") {
        common_vendor.index.showToast({
          title: "请填写预算",
          icon: "none"
        });
        return;
      }
      const moneyValue = parseInt(this.formData.money);
      if (isNaN(moneyValue) || moneyValue < 0) {
        common_vendor.index.showToast({
          title: "请输入有效的预算金额",
          icon: "none"
        });
        return;
      }
      const activityDateTime = /* @__PURE__ */ new Date(`${this.formData.activityDate}T${this.formData.activityTime}:00`);
      const now = /* @__PURE__ */ new Date();
      if (activityDateTime <= now) {
        common_vendor.index.showToast({
          title: "活动时间不能是过去的时间",
          icon: "none"
        });
        return;
      }
      if (this.isSaving)
        return;
      this.isSaving = true;
      try {
        await this.userStore.ensureUserInfo();
        const userInfo = this.userStore.userInfo;
        if (this.isEdit) {
          const activityDateTime2 = /* @__PURE__ */ new Date(`${this.formData.activityDate}T${this.formData.activityTime}:00`);
          const now2 = /* @__PURE__ */ new Date();
          if (activityDateTime2 <= now2) {
            common_vendor.index.showToast({
              title: "活动时间不能是过去的时间",
              icon: "none"
            });
            return;
          }
          const ownerId = await this.userStore.getOpenId();
          const ownerName = userInfo.userName;
          const ownerImage = userInfo.image;
          const updateData = {
            circleId: this.circleId,
            ...this.formData,
            ownerId,
            ownerName,
            ownerImage
          };
          await request_api_circle.circleApi.updateCircle(updateData);
        } else {
          const ownerId = await this.userStore.getOpenId();
          const ownerName = userInfo.userName;
          const ownerImage = userInfo.image;
          const createData = {
            ...this.formData,
            ownerImage
          };
          await request_api_circle.circleApi.createCircle(createData, ownerId, ownerName);
        }
        common_vendor.index.showToast({
          title: "保存成功",
          icon: "success"
        });
        if (!this.isEdit) {
          this.circleStore.markNeedRefresh();
        }
        const circleId = this.circleId;
        setTimeout(() => {
          const pages = getCurrentPages();
          if (this.isEdit && pages.length > 1) {
            if (circleId) {
              common_vendor.index.navigateTo({
                url: `/pages/circle/detail?circleId=${circleId}`
              });
            } else {
              common_vendor.index.navigateBack();
            }
          } else {
            common_vendor.index.switchTab({
              url: "/pages/circle/circle"
            });
          }
        }, 1500);
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/circle/create.vue:566", "创建圈子失败:", error);
        common_vendor.index.showToast({
          title: error.message || "创建失败，请重试",
          icon: "none",
          duration: 2e3
        });
      } finally {
        this.isSaving = false;
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
  var _a, _b;
  return {
    a: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    b: common_vendor.t($data.isEdit ? "编辑圈子" : "创建圈子"),
    c: common_vendor.t(((_b = (_a = _ctx.userStore) == null ? void 0 : _a.userInfo) == null ? void 0 : _b.userName) || "我"),
    d: $data.formData.circleName,
    e: common_vendor.o(($event) => $data.formData.circleName = $event.detail.value),
    f: common_vendor.o([($event) => $data.formData.money = $event.detail.value, (...args) => $options.onMoneyInput && $options.onMoneyInput(...args)]),
    g: common_vendor.o((...args) => $options.onMoneyBlur && $options.onMoneyBlur(...args)),
    h: $data.formData.money,
    i: $data.formData.introduction,
    j: common_vendor.o(($event) => $data.formData.introduction = $event.detail.value),
    k: common_vendor.t($data.formData.location || "点击选择位置"),
    l: common_vendor.p({
      type: "right",
      size: "16"
    }),
    m: common_vendor.o((...args) => $options.openMap && $options.openMap(...args)),
    n: common_vendor.t($data.formData.activityDate || "选择日期"),
    o: common_vendor.p({
      type: "right",
      size: "16"
    }),
    p: $data.formData.activityDate,
    q: $data.todayDate,
    r: common_vendor.o((...args) => $options.onActivityDateChange && $options.onActivityDateChange(...args)),
    s: common_vendor.t($data.formData.activityTime || "选择时间"),
    t: common_vendor.p({
      type: "right",
      size: "16"
    }),
    v: $data.formData.activityTime,
    w: $options.getMinTime(),
    x: common_vendor.o((...args) => $options.onActivityTimeChange && $options.onActivityTimeChange(...args)),
    y: common_vendor.t($data.isSaving ? "保存中..." : "保存"),
    z: common_vendor.o((...args) => $options.saveCircle && $options.saveCircle(...args)),
    A: $data.isSaving
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-a348a247"]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/circle/create.js.map
