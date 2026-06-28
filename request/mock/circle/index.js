// 生成模拟数据
export const generateMockList = (params = {}) => {
  const current = parseInt(params && params.current) || 1
  const size = parseInt(params && params.size) || 10
  
  console.log('[Mock] 生成数据，参数:', { current, size })
  
  const list = []
  const startIndex = (current - 1) * size
  const totalCount = 30 // 总数据量
  
  for (let i = 0; i < size; i++) {
    const id = startIndex + i
    if (id >= totalCount) break // 如果超过总数据量就停止

    if (id === 0) {
      list.push({
        circleId: 'circle_barcelona',
        circleName: '找人一起去巴塞罗那',
        ownerId: 'user_mia',
        ownerName: 'Mia',
        ownerImage: '/static/default-avatar.png',
        avatar: '/static/default-avatar.png',
        memberCount: 3,
        topic: '巴塞罗那建筑与艺术',
        slogan: '想找能一起暴走看高迪和毕加索的人',
        introduction: '很喜欢毕加索，也喜欢米拉的建筑风格，想在暑假去看看，最好有几个志同道合的朋友一起。',
        activityLocation: '先线上聊，见面前再约咖啡店',
        activityTime: '2026-07-12 19:30',
        distance: '4.2',
        createTime: '2026-06-27 19:00'
      })
      continue
    }

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
    status: 10000,
    message: 'success',
    data: {
      circlePageItemList: list,
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
  const current = parseInt(params && params.current) || 1
  const size = parseInt(params && params.size) || 10
  
  if (current < 1 || size < 1) {
    console.error('[Mock] 参数错误:', { current, size })
    return {
      status: 10001,
      message: '参数错误',
      data: {
        circlePageItemList: [],
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
