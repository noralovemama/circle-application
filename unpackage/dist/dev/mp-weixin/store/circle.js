"use strict";
const common_vendor = require("../common/vendor.js");
require("./index.js");
const request_api_circle = require("../request/api/circle.js");
const useCircleStore = common_vendor.defineStore("circle", {
  state: () => ({
    list: [],
    pagination: {
      current: 1,
      size: 10,
      total: 0,
      hasMore: true
    },
    loading: false,
    refreshing: false,
    error: null,
    needRefresh: false
    // 标记是否需要刷新数据
  }),
  actions: {
    // 重置状态
    reset() {
      this.list = [];
      this.pagination = {
        current: 1,
        size: 10,
        total: 0,
        hasMore: true
      };
      this.error = null;
    },
    // 标记需要刷新
    markNeedRefresh() {
      this.needRefresh = true;
    },
    // 清除刷新标记
    clearNeedRefresh() {
      this.needRefresh = false;
    },
    // 获取圈子列表
    async getCircleList({ isRefresh = false, longitude, latitude, userId, flag }) {
      common_vendor.index.__f__("log", "at store/circle.js:44", "[Store] 开始获取列表:", {
        isRefresh,
        currentState: { ...this.pagination },
        listLength: this.list.length
      });
      if (isRefresh) {
        if (this.refreshing)
          return;
        this.refreshing = true;
        this.reset();
      } else {
        if (this.loading || !this.pagination.hasMore) {
          common_vendor.index.__f__("log", "at store/circle.js:57", "[Store] 跳过请求:", { loading: this.loading, hasMore: this.pagination.hasMore });
          return;
        }
        this.loading = true;
      }
      try {
        let params = {
          // current: this.pagination.current,
          // size: this.pagination.size,
          longitude,
          latitude,
          flag
        };
        if (userId) {
          params["userId"] = userId;
        }
        common_vendor.index.__f__("log", "at store/circle.js:74", "[Store] 请求参数:", params);
        const res = await request_api_circle.circleApi.getCircleList(params);
        common_vendor.index.__f__("log", "at store/circle.js:77", "[Store] 请求响应:", res);
        if (res.status === 1e4 && res.data) {
          const { circlePageItemList: records } = res.data;
          const total = 1;
          const size = records.length;
          const current = 0;
          if (isRefresh) {
            this.list = records || [];
          } else {
            this.list = [...this.list, ...records || []];
          }
          const hasMore = Array.isArray(records) && records.length === size;
          this.pagination = {
            current: hasMore ? current + 1 : current,
            size,
            total,
            hasMore
          };
          common_vendor.index.__f__("log", "at store/circle.js:101", "[Store] 更新后的状态:", {
            listLength: this.list.length,
            pagination: { ...this.pagination }
          });
        } else {
          throw new Error(res.message || "请求失败");
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at store/circle.js:109", "[Store] 请求失败:", error);
        this.error = error.message || "获取圈子列表失败";
        common_vendor.index.showToast({
          title: this.error,
          icon: "none"
        });
      } finally {
        this.loading = false;
        this.refreshing = false;
        common_vendor.index.__f__("log", "at store/circle.js:118", "[Store] 请求完成:", {
          loading: this.loading,
          refreshing: this.refreshing,
          listLength: this.list.length,
          pagination: { ...this.pagination }
        });
      }
    }
  }
});
exports.useCircleStore = useCircleStore;
//# sourceMappingURL=../../.sourcemap/mp-weixin/store/circle.js.map
