import request from '../request'

function combineDateTimeToTimestamp(activityDate, activityTime) {
    // 组合日期和时间，精确到秒
    const combinedDateTime = `${activityDate} ${activityTime}:00`;
    // 创建 Date 对象
    const date = new Date(combinedDateTime);
    // 获取时间戳
    const timestamp = date.getTime()/1000;
    return timestamp;
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
    console.log('[API] 请求圈子详情:', params)
	
	let params = {
		circleId,
		longitude,
		latitude,
		userId
	}
    return request({
      url: 'circle/detail',
      method: 'GET',
      data: params,
      mock: false
    })
  },

  // 创建圈子
  createCircle: (data, ownerId, ownerName) => {
    console.log('[API] 创建圈子:', data)
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
		ownerImage,
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
  updateCircle: (data) => {
    console.log('[API] 更新圈子:', data)
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
	const dateStr = data.activityDate + " " + data.activityTime + ":00"
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
		ownerImage
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
  updateCircleMessage: (data) => {
    console.log('[API] 圈子留言操作:', data)
    return request({
      url: 'circle/message',
      method: 'POST',
      data,
      mock: false
    })
  }
} 