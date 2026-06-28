// 更新圈子的 mock 处理函数
export const updateCircle = (data) => {
  console.log('[Mock] 更新圈子，参数:', data)
  
  // 模拟更新成功
  if (Math.random() > 0.1) { // 90% 成功率
    return {
      status: 10000,
      message: 'success',
      data: {
        circleId: data.circleId,
        circleName: data.name,
        topic: data.theme,
        slogan: data.slogan,
        introduction: data.description,
        activityLocation: data.location,
        activityTime: data.date,
        latitude: data.latitude,
        longitude: data.longitude,
        updateTime: new Date().toISOString()
      }
    }
  }
  
  // 模拟更新失败
  throw new Error('模拟更新失败')
} 
