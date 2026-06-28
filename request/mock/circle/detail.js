// 生成模拟的圈子详情数据
const getCircleDetail = (params) => {
  console.log('[Mock] 获取圈子详情，参数:', params)
  const { circleId } = params
  
  return {
    status: 10000,
    message: 'success',
    data: {
      circleId: circleId,
      circleName: '周末一起爬山',
      ownerId: 'user_1',
      ownerName: '小明',
      topic: '户外运动',
      slogan: '让运动成为生活的一部分',
      introduction: '每个周末组织一次登山活动，欢迎热爱运动的小伙伴加入。我们会选择不同的路线，享受运动的乐趣，结识志同道合的朋友。',
      activityTime: '每周六 09:00',
      activityLocation: '莫干山',
      distance: '3.5公里',
      latitude: '30.2333',
      longitude: '120.1666',
      joinStatus: 0, // 0: 未加入, 1: 已加入
      circleUserItemList: [
        {
          userId: 'user_1',
          userName: '小明',
          image: '/static/default-avatar.png',
          introduction: '90后，热爱运动，喜欢结交朋友',
          ownerFlag: 1 // 1: 圈主, 0: 成员
        },
        {
          userId: 'user_2',
          userName: '小红',
          image: '/static/default-avatar.png',
          introduction: '喜欢户外运动，周末想认识新朋友',
          ownerFlag: 0
        },
        {
          userId: 'user_3',
          userName: '小张',
          image: '/static/default-avatar.png',
          introduction: '摄影爱好者，想找志同道合的朋友',
          ownerFlag: 0
        }
      ]
    }
  }
}

export { getCircleDetail } 
