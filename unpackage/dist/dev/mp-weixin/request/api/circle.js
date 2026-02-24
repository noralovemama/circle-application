"use strict";
const common_vendor = require("../../common/vendor.js");
const request_request = require("../request.js");
function combineDateTimeToTimestamp(activityDate, activityTime) {
  const combinedDateTime = `${activityDate} ${activityTime}:00`;
  const date = new Date(combinedDateTime);
  const timestamp = date.getTime() / 1e3;
  return timestamp;
}
const circleApi = {
  // 获取圈子列表
  getCircleList: (params) => {
    common_vendor.index.__f__("log", "at request/api/circle.js:17", "[API] 请求圈子列表:", params);
    return request_request.request({
      url: "circle/page",
      method: "GET",
      data: params,
      mock: false
    });
  },
  // 获取圈子详情
  getCircleDetail: (circleId, userId, longitude, latitude) => {
    common_vendor.index.__f__("log", "at request/api/circle.js:28", "[API] 请求圈子详情:", params);
    let params = {
      circleId,
      longitude,
      latitude,
      userId
    };
    return request_request.request({
      url: "circle/detail",
      method: "GET",
      data: params,
      mock: false
    });
  },
  // 创建圈子
  createCircle: (data, ownerId, ownerName) => {
    common_vendor.index.__f__("log", "at request/api/circle.js:46", "[API] 创建圈子:", data);
    const {
      circleName,
      topic,
      slogan,
      introduction,
      location,
      latitude,
      longitude,
      activityTime,
      activityDate,
      ownerImage,
      money
    } = data;
    const activityLocation = location;
    const activityTimeDate = combineDateTimeToTimestamp(activityDate, activityTime);
    const param = {
      activityLocation,
      activityTime: activityTimeDate,
      circleName,
      introduction,
      latitude,
      longitude,
      ownerId,
      slogan,
      topic,
      ownerName,
      ownerImage,
      money: parseInt(money) || 0
    };
    return request_request.request({
      url: "circle/update",
      method: "POST",
      data: param,
      mock: false
    });
  },
  // 更新圈子
  updateCircle: (data) => {
    common_vendor.index.__f__("log", "at request/api/circle.js:86", "[API] 更新圈子:", data);
    const {
      circleName,
      topic,
      slogan,
      introduction,
      location,
      latitude,
      longitude,
      activityTime,
      activityDate,
      circleId,
      money,
      ownerId,
      ownerName,
      ownerImage
    } = data;
    data.activityDate + " " + data.activityTime + ":00";
    const activityTimeDate = combineDateTimeToTimestamp(activityDate, activityTime);
    let params = {
      circleId,
      circleName,
      topic,
      slogan,
      introduction,
      activityLocation: location,
      latitude,
      longitude,
      activityTime: activityTimeDate,
      money: parseInt(money) || 0,
      ownerId,
      ownerName,
      ownerImage
    };
    return request_request.request({
      url: "circle/update",
      method: "POST",
      data: params,
      mock: false
    });
  },
  bindCirCle: (data) => {
    common_vendor.index.__f__("log", "at request/api/circle.js:130", "[API] 更新圈子:", data);
    return request_request.request({
      url: "circle/bind",
      method: "POST",
      data,
      mock: false
    });
  },
  // 圈子留言操作（创建/编辑/删除）
  updateCircleMessage: (data) => {
    common_vendor.index.__f__("log", "at request/api/circle.js:141", "[API] 圈子留言操作:", data);
    return request_request.request({
      url: "circle/message",
      method: "POST",
      data,
      mock: false
    });
  }
};
exports.circleApi = circleApi;
//# sourceMappingURL=../../../.sourcemap/mp-weixin/request/api/circle.js.map
