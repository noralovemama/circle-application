// 生成模拟数据
export const generateMockList = (params = {}) => {
  const current = parseInt(params?.current) || 1
  const size = parseInt(params?.size) || 10
  
  console.log('[Mock] 生成数据，参数:', { current, size })
  
  const list = []
  const startIndex = (current - 1) * size
  const totalCount = 30 // 总数据量
  
  for (let i = 0; i < size; i++) {
    const id = startIndex + i
    if (id >= totalCount) break // 如果超过总数据量就停止
    
    list.push({
      circleId: `circle_${id}`,
      circleName: `圈子${id + 1}`,
      ownerId: `user_${id + 1}`,
      ownerName: `用户${id + 1}`,
      avatar: '/static/default-avatar.png',
      memberCount: Math.floor(Math.random() * 100),
      description: `这是第${id + 1}个圈子的描述`,
      distance: `${Math.floor(Math.random() * 20)}公里`,
      createTime: '2024-01-15 19:00'
    })
  }

  console.log('[Mock] 生成的列表:', {
    startIndex,
    listLength: list.length,
    firstItem: list[0],
    lastItem: list[list.length - 1]
  })
  
  return {
    code: 0,
    message: 'success',
    data: {
      records: list,
      total: totalCount,
      size: size,
      current: current
    }
  }
}

// 导出处理函数
export const page = (params) => {
  console.log('[Mock] 收到请求:', params)
  
  // 参数验证和转换
  const current = parseInt(params?.current) || 1
  const size = parseInt(params?.size) || 10
  
  if (current < 1 || size < 1) {
    console.error('[Mock] 参数错误:', { current, size })
    return {
      code: -1,
      message: '参数错误',
      data: {
        records: [],
        total: 0,
        size: size,
        current: current
      }
    }
  }
  
  const response = generateMockList(params)
  console.log('[Mock] 返回数据:', response)
  return response
}

export const list = (params) => {
  return page(params)
} 