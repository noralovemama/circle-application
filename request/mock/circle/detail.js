// 生成模拟的圈子详情数据
const getCircleDetail = (params) => {
  console.log('[Mock] 获取圈子详情，参数:', params)
  const { circleId } = params

  if (circleId === 'circle_barcelona') {
    return {
      status: 10000,
      message: 'success',
      data: {
        circleId: 'circle_barcelona',
        circleName: '找人一起去巴塞罗那',
        ownerId: 'user_mia',
        ownerName: 'Mia',
        ownerImage: '/static/default-avatar.png',
        topic: '巴塞罗那建筑与艺术',
        slogan: '想找能一起暴走看高迪和毕加索的人',
        introduction: '很喜欢毕加索，也喜欢米拉的建筑风格，想在暑假去看看，最好有几个志同道合的朋友一起。如果有人也想认真逛圣家堂、米拉之家、毕加索博物馆，可以先线上聊聊路线和预算。',
        activityTime: '2026-07-12 19:30',
        activityLocation: '先线上聊，见面前再约静安寺附近咖啡店',
        distance: '4.2公里',
        latitude: '31.2231',
        longitude: '121.4450',
        money: 0,
        maxMembers: 6,
        joinStatus: 0,
        circleUserItemList: [
          {
            userId: 'user_mia',
            userName: 'Mia',
            image: '/static/default-avatar.png',
            age: '29岁',
            company: '品牌策划',
            school: '喜欢现代艺术展',
            introduction: '最近一直在看高迪和米罗，想认真做一次巴塞罗那行前讨论。',
            ownerFlag: 1
          },
          {
            userId: 'user_azhe',
            userName: '阿泽',
            image: '/static/default-avatar.png',
            age: '31岁',
            company: '产品经理',
            school: '每年都会排一个城市旅行',
            introduction: '偏路线和预算党，擅长做行程表。',
            ownerFlag: 0
          },
          {
            userId: 'user_luna',
            userName: 'Luna',
            image: '/static/default-avatar.png',
            age: '27岁',
            company: '插画师',
            school: '很喜欢建筑和博物馆',
            introduction: '想找同频的人一起慢慢逛，不想走马观花。',
            ownerFlag: 0
          }
        ]
      }
    }
  }
  
  return {
    code: 0,
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