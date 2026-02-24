"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
const store_index = require("./store/index.js");
if (!Math) {
  "./pages/circle/circle.js";
  "./pages/circle/detail.js";
  "./pages/user/user.js";
  "./pages/profile/profileNew.js";
  "./pages/profile/profileDetail.js";
  "./pages/circle/create.js";
  "./pages/login/login.js";
}
const pages = [
  "pages/index/index",
  "pages/circle/list",
  "pages/circle/create",
  "pages/circle/detail",
  "pages/mine/index",
  "pages/profile/profileNew"
];
const window = {
  backgroundTextStyle: "light",
  navigationBarBackgroundColor: "#fff",
  navigationBarTitleText: "圈子",
  navigationBarTextStyle: "black"
};
const tabBar = {
  color: "#999999",
  selectedColor: "#1296db",
  backgroundColor: "#ffffff",
  list: [
    {
      pagePath: "pages/index/index",
      text: "首页",
      iconPath: "static/images/tab/home.png",
      selectedIconPath: "static/images/tab/home-active.png"
    },
    {
      pagePath: "pages/circle/list",
      text: "圈子",
      iconPath: "static/images/tab/circle.png",
      selectedIconPath: "static/images/tab/circle-active.png"
    },
    {
      pagePath: "pages/mine/index",
      text: "我的",
      iconPath: "static/images/tab/mine.png",
      selectedIconPath: "static/images/tab/mine-active.png"
    }
  ]
};
const requiredPrivateInfos = [
  "chooseLocation",
  "getLocation"
];
const permission = {
  "scope.userLocation": {
    desc: "你的位置信息将用于创建圈子时设置位置"
  }
};
const sitemapLocation = "sitemap.json";
const App = {
  pages,
  window,
  tabBar,
  requiredPrivateInfos,
  permission,
  sitemapLocation
};
function createApp() {
  const app = common_vendor.createSSRApp(App);
  app.use(store_index.store);
  app.use(common_vendor.createPinia());
  app.config.globalProperties.$adpid = "1111111111";
  app.config.globalProperties.$backgroundAudioData = {
    playing: false,
    playTime: 0,
    formatedPlayTime: "00:00:00"
  };
  return {
    app,
    Vuex: common_vendor.index$1,
    // 如果 nvue 使用 vuex 的各种map工具方法时，必须 return Vuex
    Pinia: common_vendor.Pinia
    // 此处必须将 Pinia 返回
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
//# sourceMappingURL=../.sourcemap/mp-weixin/app.js.map
