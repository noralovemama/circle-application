import request from '../request'
import { toSubmittableImageBase64 } from '@/utils/image'

function combineDateTimeToTimestamp(activityDate, activityTime) {
    // 组合日期和时间，精确到秒
    const combinedDateTime = `${activityDate} ${activityTime}:00`;
    // 创建 Date 对象
    const date = new Date(combinedDateTime);
    // 获取时间戳
    const timestamp = date.getTime()/1000;
    return timestamp;
}

function sanitizeImageLog(data) {
  if (!data || typeof data !== 'object') return data
  return {
    ...data,
    ownerImage: data.ownerImage ? `[base64:${String(data.ownerImage).length}]` : data.ownerImage,
    userImage: data.userImage ? `[base64:${String(data.userImage).length}]` : data.userImage
  }
}


export default {
  // 获取圈子列表
  getCircleList: (params) => {
    console.log('[API] 请求圈子列表:', params)
    return request({
      url: 'circle/page',
      method: 'GET',
      data: params,
      mock: false
    })
  },

  // 获取圈子详情
  getCircleDetail: (circleId, userId, longitude, latitude) => {
	let params = {
		circleId,
		longitude,
		latitude,
		userId
	}
    console.log('[API] 请求圈子详情:', params)
    return request({
      url: 'circle/detail',
      method: 'GET',
      data: params,
      mock: false
    })
  },

  // 创建圈子
  createCircle: (data = {}, ownerId, ownerName) => {
    console.log('[API] 创建圈子:', sanitizeImageLog(data))
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
	} = data
	const activityLocation = location
	const activityTimeDate = combineDateTimeToTimestamp(activityDate, activityTime)
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
		ownerImage: toSubmittableImageBase64(ownerImage),
		money: parseInt(money) || 0
	}
    return request({
      url: 'circle/update',
      method: 'POST',
      data: param,
      mock: false
    })
  },

  // 更新圈子
  updateCircle: (data = {}) => {
    console.log('[API] 更新圈子:', sanitizeImageLog(data))
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
	} = data
	const activityTimeDate = combineDateTimeToTimestamp(activityDate, activityTime)
	let params  = {
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
		ownerImage: toSubmittableImageBase64(ownerImage)
	}
	
    return request({
      url: 'circle/update',
      method: 'POST',
      data: params,
      mock: false
    })
  },
  
  bindCirCle: (data)=>{
	  console.log('[API] 更新圈子:', data)
	  return request({
	    url: 'circle/bind',
	    method: 'POST',
	    data,
	    mock: false
	  })
  },

  // 圈子留言操作（创建/编辑/删除）
  updateCircleMessage: (data = {}) => {
    const payload = {
      ...data,
      userImage: toSubmittableImageBase64(data.userImage)
    }
    console.log('[API] 圈子留言操作:', {
      ...payload,
      userImage: payload.userImage ? `[base64:${String(payload.userImage).length}]` : ''
    })
    return request({
      url: 'circle/message',
      method: 'POST',
      data: payload,
      mock: false
    })
  }
}
