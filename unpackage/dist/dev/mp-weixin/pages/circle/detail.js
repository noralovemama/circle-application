"use strict";
const common_vendor = require("../../common/vendor.js");
require("../../store/index.js");
const request_api_circle = require("../../request/api/circle.js");
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
      options: {},
      userId: "",
      circle: {
        circleId: "",
        circleName: "",
        ownerId: "",
        ownerName: "",
        topic: "",
        slogan: "",
        introduction: "",
        activityTime: "",
        activityLocation: "",
        distance: "",
        latitude: "",
        longitude: "",
        budget: "",
        maxMembers: 6,
        joinStatus: 0,
        circleUserItemList: []
      },
      longitude: "",
      latitude: "",
      commentContent: "",
      editingComment: null
    };
  },
  computed: {
    isOwner() {
      if (!this.userId)
        return false;
      return this.circle.ownerId === this.userId;
    },
    isParticipant() {
      return this.circle.joinStatus === 1;
    },
    isActivityStarted() {
      if (!this.circle.activityTime)
        return false;
      const activityTime = new Date(this.circle.activityTime);
      return activityTime < /* @__PURE__ */ new Date();
    },
    isFull() {
      var _a;
      return ((_a = this.circle.circleUserItemList) == null ? void 0 : _a.length) >= this.circle.maxMembers;
    },
    remainingSpots() {
      var _a;
      const currentMembers = ((_a = this.circle.circleUserItemList) == null ? void 0 : _a.length) || 0;
      return Math.max(0, this.circle.maxMembers - currentMembers);
    },
    buttonText() {
      if (this.isOwner)
        return "编辑";
      if (this.isActivityStarted)
        return "活动已开始";
      if (this.isFull)
        return "人数已满";
      return this.circle.joinStatus === 1 ? "您已加入" : "加入";
    },
    ownerInfo() {
      var _a;
      return (_a = this.circle.circleUserItemList) == null ? void 0 : _a.find((member) => member.ownerFlag === 1);
    },
    canComment() {
      return this.isParticipant || this.isOwner;
    }
  },
  async onLoad(options) {
    this.options = options;
    await this.loadCurrentPage(options);
  },
  // 微信分享给朋友
  onShareAppMessage() {
    return {
      title: `${this.circle.circleName} - ${this.circle.ownerName}发起的圈子`,
      path: `/pages/circle/detail?circleId=${this.circle.circleId}`,
      imageUrl: "/static/share-cover.png"
    };
  },
  // 微信分享到朋友圈
  onShareTimeline() {
    return {
      title: `${this.circle.circleName} - ${this.circle.ownerName}发起的圈子`,
      imageUrl: "/static/share-cover.png"
    };
  },
  // async onShow(options){
  // 	await this.loadCurrentPage(options)
  // },
  methods: {
    memberBasicText(member) {
      let result = "";
      const { age, company, school } = member;
      if (age) {
        result += age + "，";
      }
      if (company) {
        result += company + "，";
      }
      if (school) {
        result += school;
      }
      return result;
    },
    async loadCurrentPage(options) {
      if (common_vendor.index.getSystemInfoSync().platform === "devtools") {
        common_vendor.index.__f__("log", "at pages/circle/detail.vue:260", "模拟器环境，使用默认位置信息");
        this.longitude = 116.24145697699653;
        this.latitude = 39.93208468967014;
        await this.loadCircleDetail(options, this.longitude, this.latitude);
        return;
      }
      common_vendor.index.getLocation({
        type: "gcj02",
        success: async ({
          longitude,
          latitude
        }) => {
          this.longitude = longitude;
          this.latitude = latitude;
          await this.loadCircleDetail(options, longitude, latitude);
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/circle/detail.vue:279", "获取位置失败：", err);
        }
      });
    },
    getAvatar(item) {
      return item.image ? item.image : "/static/default-avatar.png";
    },
    goBack() {
      common_vendor.index.switchTab({
        url: "/pages/circle/circle"
      });
    },
    navigateToUser() {
      common_vendor.index.navigateTo({
        url: "/pages/user/user"
      });
    },
    async loadCircleDetail(options, longitude, latitude) {
      this.userId = await common_vendor.index.getStorageSync("token");
      if (options == null ? void 0 : options.circleId) {
        this.circle = {
          ...this.circle,
          circleId: options.circleId
        };
        try {
          const openId = await common_vendor.index.getStorageSync("token") || "";
          const res = await request_api_circle.circleApi.getCircleDetail(options.circleId, openId, this.longitude, this.latitude);
          if (res.status === 1e4 && res.data) {
            this.circle = res.data;
          }
        } catch (error) {
          common_vendor.index.__f__("error", "at pages/circle/detail.vue:315", "获取圈子详情失败:", error);
          common_vendor.index.showToast({
            title: "获取圈子详情失败",
            icon: "none"
          });
        }
      }
    },
    async handleAction() {
      if (this.isOwner) {
        this.navigateToEdit();
      } else {
        this.handleJoin();
      }
    },
    navigateToEdit() {
      common_vendor.index.navigateTo({
        url: `/pages/circle/create?circleId=${this.circle.circleId}`
      });
    },
    async handleJoin() {
      const openId = await common_vendor.index.getStorageSync("token") || "";
      if (this.circle.joinStatus === 0) {
        this.circle.joinStatus = 1;
        const res = await request_api_circle.circleApi.bindCirCle({
          circleId: this.circle.circleId,
          userId: openId,
          status: 1
        });
        if (res.status === 1e4 && res.data) {
          common_vendor.index.showToast({
            title: "加入成功",
            icon: "success"
          });
        } else {
          common_vendor.index.showToast({
            title: "加入失败" + res.data.msg,
            icon: "error"
          });
        }
      } else {
        this.circle.joinStatus = 0;
        const res = await request_api_circle.circleApi.bindCirCle({
          circleId: this.circle.circleId,
          userId: openId,
          status: 0
        });
        if (res.status === 1e4 && res.data) {
          common_vendor.index.showToast({
            title: "已退出圈子",
            icon: "none"
          });
        } else {
          common_vendor.index.showToast({
            title: "退出失败" + res.data.msg,
            icon: "error"
          });
        }
      }
      await this.loadCurrentPage(this.options);
    },
    // 预览图片
    previewImage(index) {
      common_vendor.index.previewImage({
        current: index,
        urls: this.circle.images
      });
    },
    // 格式化预算
    formatBudget(budget) {
      if (!budget)
        return "免费";
      return budget;
    },
    // 格式化活动时间
    formatActivityTime(time) {
      if (!time)
        return "时间待定";
      const date = new Date(time);
      const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
      const weekday = weekdays[date.getDay()];
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${date.getFullYear()}.${month}.${day} ${weekday} ${hours}:${minutes}`;
    },
    // 显示评论弹框
    async showCommentModal() {
      try {
        common_vendor.index.showLoading({
          title: "加载中..."
        });
        await this.userStore.ensureUserInfo();
        common_vendor.index.hideLoading();
        this.commentContent = "";
        this.editingComment = null;
        this.$refs.commentPopup.open();
      } catch (error) {
        common_vendor.index.hideLoading();
        common_vendor.index.__f__("error", "at pages/circle/detail.vue:423", "获取用户信息失败:", error);
        common_vendor.index.showToast({
          title: "获取用户信息失败，请重试",
          icon: "none"
        });
      }
    },
    // 隐藏评论弹框
    hideCommentModal() {
      this.$refs.commentPopup.close();
      this.commentContent = "";
      this.editingComment = null;
    },
    // 编辑评论
    async editComment(comment) {
      try {
        common_vendor.index.showLoading({
          title: "加载中..."
        });
        await this.userStore.ensureUserInfo();
        common_vendor.index.hideLoading();
        this.editingComment = comment;
        this.commentContent = comment.content;
        this.$refs.commentPopup.open();
      } catch (error) {
        common_vendor.index.hideLoading();
        common_vendor.index.__f__("error", "at pages/circle/detail.vue:455", "获取用户信息失败:", error);
        common_vendor.index.showToast({
          title: "获取用户信息失败，请重试",
          icon: "none"
        });
      }
    },
    // 删除评论
    async deleteComment(comment) {
      common_vendor.index.showModal({
        title: "确认删除",
        content: "确定要删除这条留言吗？",
        success: async (res) => {
          if (res.confirm) {
            try {
              await this.userStore.ensureUserInfo();
              if (!this.validateUserInfo()) {
                return;
              }
              common_vendor.index.showLoading({ title: "删除中..." });
              const commentData = this.buildCommentData("delete", comment.messageId);
              const res2 = await request_api_circle.circleApi.updateCircleMessage(commentData);
              if (res2.status === 1e4) {
                common_vendor.index.hideLoading();
                common_vendor.index.showLoading({ title: "刷新中..." });
                const refreshSuccess = await this.refreshCircleDetail();
                common_vendor.index.hideLoading();
                if (refreshSuccess) {
                  common_vendor.index.showToast({ title: "删除成功", icon: "success" });
                }
              }
            } catch (error) {
              common_vendor.index.hideLoading();
              common_vendor.index.__f__("error", "at pages/circle/detail.vue:495", "删除评论失败:", error);
              common_vendor.index.showToast({ title: "删除失败", icon: "none" });
            }
          }
        }
      });
    },
    // 验证用户信息完整性
    validateUserInfo() {
      const userInfo = this.userStore.userInfo;
      if (!userInfo.userName) {
        common_vendor.index.showToast({ title: "用户名称不能为空", icon: "none" });
        return false;
      }
      if (!userInfo.image) {
        common_vendor.index.showToast({ title: "用户头像不能为空", icon: "none" });
        return false;
      }
      return true;
    },
    // 构建评论数据
    buildCommentData(operation = "create", messageId = null) {
      const baseData = {
        circleId: this.circle.circleId,
        content: this.commentContent,
        userId: this.userId,
        userName: this.userStore.userInfo.userName,
        userImage: this.userStore.userInfo.image,
        status: 1
        // 默认生效状态
      };
      if (operation === "edit" && messageId) {
        baseData.messageId = messageId;
      } else if (operation === "delete" && messageId) {
        baseData.messageId = messageId;
        baseData.status = 0;
      }
      return baseData;
    },
    // 提交评论
    async submitComment() {
      if (!this.commentContent.trim()) {
        common_vendor.index.showToast({ title: "请输入留言内容", icon: "none" });
        return;
      }
      try {
        await this.userStore.ensureUserInfo();
        if (!this.validateUserInfo()) {
          return;
        }
        common_vendor.index.showLoading({ title: "提交中..." });
        if (this.editingComment) {
          const commentData = this.buildCommentData("edit", this.editingComment.messageId);
          const res = await request_api_circle.circleApi.updateCircleMessage(commentData);
          if (res.status === 1e4) {
            common_vendor.index.hideLoading();
            common_vendor.index.showLoading({ title: "刷新中..." });
            const refreshSuccess = await this.refreshCircleDetail();
            common_vendor.index.hideLoading();
            if (refreshSuccess) {
              common_vendor.index.showToast({ title: "编辑成功", icon: "success" });
            }
          }
        } else {
          const commentData = this.buildCommentData("create");
          const res = await request_api_circle.circleApi.updateCircleMessage(commentData);
          if (res.status === 1e4) {
            common_vendor.index.hideLoading();
            common_vendor.index.showLoading({ title: "刷新中..." });
            const refreshSuccess = await this.refreshCircleDetail();
            common_vendor.index.hideLoading();
            if (refreshSuccess) {
              common_vendor.index.showToast({ title: "发表成功", icon: "success" });
            }
          }
        }
        this.hideCommentModal();
      } catch (error) {
        common_vendor.index.hideLoading();
        common_vendor.index.__f__("error", "at pages/circle/detail.vue:587", "提交评论失败:", error);
        common_vendor.index.showToast({ title: "操作失败", icon: "none" });
      }
    },
    // 获取评论列表（从圈子详情数据中获取）
    getComments() {
      let messageList = this.circle.circleMessageItemList || this.circle.messages || [];
      if (Array.isArray(messageList)) {
        return messageList.filter((comment) => {
          return !comment.hasOwnProperty("status") || comment.status === 1;
        }).sort((a, b) => new Date(a.createTime) - new Date(b.createTime));
      }
      return [];
    },
    // 检查是否可以管理评论
    canManageComment(comment) {
      return this.isOwner || this.isParticipant && comment.userId === this.userId;
    },
    // 检查是否可以编辑评论（只能编辑自己的评论）
    canEditComment(comment) {
      return comment.userId === this.userId;
    },
    // 检查是否可以删除评论（圈主可以删除任何评论，参与者只能删除自己的评论）
    canDeleteComment(comment) {
      return this.isOwner || comment.userId === this.userId;
    },
    // 刷新圈子详情
    async refreshCircleDetail() {
      try {
        await this.loadCurrentPage(this.options);
        return true;
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/circle/detail.vue:630", "刷新圈子详情失败:", error);
        common_vendor.index.showToast({
          title: "刷新失败，请重试",
          icon: "none"
        });
        return false;
      }
    }
  }
};
if (!Array) {
  const _easycom_uni_popup2 = common_vendor.resolveComponent("uni-popup");
  _easycom_uni_popup2();
}
const _easycom_uni_popup = () => "../../uni_modules/uni-popup/components/uni-popup/uni-popup.js";
if (!Math) {
  _easycom_uni_popup();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  var _a, _b, _c;
  return common_vendor.e({
    a: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    b: common_vendor.t($data.circle.circleName),
    c: (_a = $options.ownerInfo) == null ? void 0 : _a.image,
    d: common_vendor.o((...args) => $options.navigateToUser && $options.navigateToUser(...args)),
    e: common_vendor.t($data.circle.ownerName),
    f: common_vendor.t($options.buttonText),
    g: $options.isOwner ? 1 : "",
    h: !$options.isOwner ? 1 : "",
    i: $data.circle.joinStatus === 1 ? 1 : "",
    j: $options.isActivityStarted || $options.isFull ? 1 : "",
    k: common_vendor.o((...args) => $options.handleAction && $options.handleAction(...args)),
    l: $options.isActivityStarted || $options.isFull,
    m: common_vendor.t($data.circle.circleName),
    n: common_vendor.t($options.formatBudget($data.circle.budget)),
    o: common_vendor.t($data.circle.topic),
    p: common_vendor.t($data.circle.slogan),
    q: common_vendor.t($options.formatActivityTime($data.circle.activityTime)),
    r: common_vendor.t($data.circle.activityLocation),
    s: common_vendor.t($data.circle.introduction),
    t: (_b = $data.circle.circleUserItemList) == null ? void 0 : _b.length
  }, ((_c = $data.circle.circleUserItemList) == null ? void 0 : _c.length) ? {
    v: common_vendor.f($data.circle.circleUserItemList, (member, k0, i0) => {
      return common_vendor.e({
        a: $options.getAvatar(member),
        b: common_vendor.t(member.userName),
        c: member.ownerFlag === 1
      }, member.ownerFlag === 1 ? {} : {}, {
        d: common_vendor.t($options.memberBasicText(member)),
        e: member.userId
      });
    })
  } : {}, {
    w: $options.canComment
  }, $options.canComment ? {
    x: common_vendor.o((...args) => $options.showCommentModal && $options.showCommentModal(...args))
  } : {}, {
    y: common_vendor.f($options.getComments(), (comment, k0, i0) => {
      return common_vendor.e({
        a: comment.userImage || "/static/default-avatar.png",
        b: common_vendor.t(comment.userName),
        c: comment.userId === $data.circle.ownerId
      }, comment.userId === $data.circle.ownerId ? {} : {}, {
        d: common_vendor.t(comment.content),
        e: common_vendor.t(comment.createTime),
        f: $options.canEditComment(comment) || $options.canDeleteComment(comment)
      }, $options.canEditComment(comment) || $options.canDeleteComment(comment) ? common_vendor.e({
        g: $options.canEditComment(comment)
      }, $options.canEditComment(comment) ? {
        h: common_vendor.o(($event) => $options.editComment(comment), comment.messageId)
      } : {}, {
        i: $options.canDeleteComment(comment)
      }, $options.canDeleteComment(comment) ? {
        j: common_vendor.o(($event) => $options.deleteComment(comment), comment.messageId)
      } : {}) : {}, {
        k: comment.messageId
      });
    }),
    z: $options.getComments().length === 0
  }, $options.getComments().length === 0 ? {} : {}, {
    A: common_vendor.t($data.editingComment ? "编辑留言" : "发表留言"),
    B: common_vendor.o((...args) => $options.hideCommentModal && $options.hideCommentModal(...args)),
    C: $data.commentContent,
    D: common_vendor.o(($event) => $data.commentContent = $event.detail.value),
    E: common_vendor.o((...args) => $options.hideCommentModal && $options.hideCommentModal(...args)),
    F: common_vendor.o((...args) => $options.submitComment && $options.submitComment(...args)),
    G: common_vendor.sr("commentPopup", "34fed4f5-0"),
    H: common_vendor.p({
      type: "bottom"
    })
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-34fed4f5"]]);
_sfc_main.__runtimeHooks = 6;
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/circle/detail.js.map
