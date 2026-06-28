export const createCircle = (data) => {
  console.log('[Mock] 创建圈子，参数:', data)
  
  // 模拟创建成功
  if (Math.random() > 0.1) { // 90% 成功率
    return {
      code: 0,
      message: 'success',
      data: {
        circleId: `circle_${Date.now()}`,
        ...data
      }
    }
  }
  
  // 模拟创建失败
  throw new Error('模拟创建失败')
} 