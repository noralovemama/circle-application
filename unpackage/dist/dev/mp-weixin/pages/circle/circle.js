"use strict";
const common_vendor = require("../../common/vendor.js");
const store_circle = require("../../store/circle.js");
const store_user = require("../../store/user.js");
require("../../store/index.js");
const common_assets = require("../../common/assets.js");
const _sfc_main = {
  setup() {
    const circleStore = store_circle.useCircleStore();
    const userStore = store_user.useUserStore();
    return {
      circleStore,
      userStore
    };
  },
  data() {
    return {
      list: [],
      pagination: {
        current: 1,
        size: 10,
        total: 0
      },
      loading: false,
      refreshing: false,
      isFromHome: true,
      pageOptions: null
      // 保存页面参数
    };
  },
  async onLoad(options) {
    common_vendor.index.__f__("log", "at pages/circle/circle.vue:123", "页面加载参数:", options);
    this.pageOptions = options;
    await this.loadCurrentPage(options);
  },
  async onShow() {
    common_vendor.index.__f__("log", "at pages/circle/circle.vue:128", "onShow 触发，pageOptions:", this.pageOptions);
    if (this.circleStore.needRefresh) {
      common_vendor.index.__f__("log", "at pages/circle/circle.vue:131", "检测到需要刷新，重新加载数据");
      this.circleStore.clearNeedRefresh();
      await this.loadCurrentPage({});
    } else if (!this.pageOptions) {
      await this.loadCurrentPage({});
    }
  },
  onUnload() {
    this.pageOptions = null;
  },
  // 微信分享给朋友
  onShareAppMessage() {
    return {
      title: "发现有趣的圈子，快来加入吧！",
      path: "/pages/circle/circle",
      imageUrl: "/static/share-cover.png"
    };
  },
  // 微信分享到朋友圈
  onShareTimeline() {
    return {
      title: "发现有趣的圈子，快来加入吧！",
      imageUrl: "/static/share-cover.png"
    };
  },
  async onTabItemTap(item) {
    if (item.index === 0) {
      this.isFromHome = true;
      common_vendor.index.setNavigationBarTitle({
        title: "圈子"
      });
      await this.loadCurrentPage({});
    }
  },
  methods: {
    // 判断圈子是否已开始
    isCircleStarted(item) {
      if (!item.activityTime) {
        return false;
      }
      if (typeof item.activityTime === "string") {
        const activityDate = new Date(item.activityTime);
        if (!isNaN(activityDate.getTime())) {
          return Date.now() > activityDate.getTime();
        }
      }
      return false;
    },
    async loadCurrentPage(options) {
      const userId = await common_vendor.index.getStorageSync("token");
      common_vendor.index.__f__("log", "at pages/circle/circle.vue:194", "loadCurrentPage options:", options);
      if (options && options.type) {
        this.isFromHome = options.type === "around";
        common_vendor.index.__f__("log", "at pages/circle/circle.vue:199", "根据参数设置isFromHome:", this.isFromHome);
      } else {
        this.isFromHome = true;
      }
      common_vendor.index.setNavigationBarTitle({
        title: this.isFromHome ? "圈子" : "我的圈子"
      });
      if (common_vendor.index.getSystemInfoSync().platform === "devtools") {
        common_vendor.index.__f__("log", "at pages/circle/circle.vue:211", "模拟器环境，使用默认位置信息");
        let param = {
          isRefresh: true,
          longitude: 116.24145697699653,
          latitude: 39.93208468967014
        };
        if (!this.isFromHome && userId) {
          param["userId"] = userId;
        }
        if (this.isFromHome) {
          param["flag"] = 0;
        } else {
          param["flag"] = 1;
        }
        common_vendor.index.__f__("log", "at pages/circle/circle.vue:226", "加载圈子列表参数:", param);
        this.circleStore.getCircleList(param);
        return;
      }
      common_vendor.index.getLocation({
        type: "gcj02",
        success: ({
          longitude,
          latitude
        }) => {
          let param = {
            isRefresh: true,
            longitude,
            latitude
          };
          if (!this.isFromHome && userId) {
            param["userId"] = userId;
          }
          if (this.isFromHome) {
            param["flag"] = 0;
          } else {
            param["flag"] = 1;
          }
          common_vendor.index.__f__("log", "at pages/circle/circle.vue:252", "加载圈子列表参数:", param);
          this.circleStore.getCircleList(param);
        },
        fail: (err) => {
          common_vendor.index.showToast({
            title: err.message || "获取位置失败",
            icon: "none"
          });
        }
      });
    },
    loadMore() {
    },
    getAvatar(item) {
      return item.ownerImage ? item.ownerImage : "/static/default-avatar.png";
    },
    getOwnerName(item) {
      return item.ownerName ? item.ownerName : "某某";
    },
    async createCircle() {
      await this.userStore.checkLoginStatus();
      common_vendor.index.navigateTo({
        url: "/pages/circle/create"
      });
    },
    navigateToDetail(item) {
      if (this.isCircleStarted(item)) {
        common_vendor.index.showToast({
          title: "该圈子已开始，无法查看",
          icon: "none"
        });
        return;
      }
      common_vendor.index.navigateTo({
        url: `/pages/circle/detail?circleId=${item.circleId}`
      });
    },
    navigateToUserProfile(item) {
      const userId = item.ownerId;
      if (userId) {
        common_vendor.index.navigateTo({
          url: `/pages/profile/profileDetail?userId=${userId}`
        });
      } else {
        common_vendor.index.showToast({
          title: "用户信息不存在",
          icon: "none"
        });
      }
    },
    switchTab(tab) {
      this.isFromHome = tab === "around";
      this.circleStore.list = [];
      this.loadCurrentPage({
        type: this.isFromHome ? "around" : "my"
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: common_assets._imports_0,
    b: $data.isFromHome ? 1 : "",
    c: common_vendor.o(($event) => $options.switchTab("around")),
    d: !$data.isFromHome ? 1 : "",
    e: common_vendor.o(($event) => $options.switchTab("my")),
    f: common_vendor.f($setup.circleStore.list, (item, k0, i0) => {
      return common_vendor.e({
        a: $options.isCircleStarted(item) ? 1 : "",
        b: $options.getAvatar(item),
        c: common_vendor.o(($event) => $options.navigateToUserProfile(item), item.circleId),
        d: common_vendor.t($options.getOwnerName(item)),
        e: common_vendor.t(item.circleName),
        f: common_vendor.t(item.createTime),
        g: common_vendor.t(item.distance),
        h: $options.isCircleStarted(item)
      }, $options.isCircleStarted(item) ? {} : {}, {
        i: $options.isCircleStarted(item) ? 1 : "",
        j: common_vendor.t($options.isCircleStarted(item) ? "已开始" : "查看"),
        k: $options.isCircleStarted(item) ? 1 : "",
        l: $options.isCircleStarted(item),
        m: common_vendor.o(($event) => $options.navigateToDetail(item), item.circleId),
        n: $options.isCircleStarted(item) ? 1 : "",
        o: item.circleId
      });
    }),
    g: $setup.circleStore.loading
  }, $setup.circleStore.loading ? {} : {}, {
    h: !$setup.circleStore.loading && !$setup.circleStore.pagination.hasMore
  }, !$setup.circleStore.loading && !$setup.circleStore.pagination.hasMore ? {} : {}, {
    i: common_vendor.o((...args) => $options.loadMore && $options.loadMore(...args)),
    j: common_vendor.o((...args) => $options.createCircle && $options.createCircle(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-06b291f3"]]);
_sfc_main.__runtimeHooks = 6;
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/circle/circle.js.map
