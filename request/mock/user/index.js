// 模拟用户相关接口
export const login = async (data) => {
  const { phoneNumber, validateCode, code } = data || {}
  
  return {
    status: 10000,
    message: 'success',
    data: {
      openId: `user_${Date.now()}`,
      userId: `user_${Date.now()}`,
      expireAt: Math.floor(Date.now() / 1000) + 7200,
      userInfo: {
        phoneNumber,
        validateCode,
        userName: '测试用户',
        image: ''
      }
    }
  }
}

export const sendCode = async (data) => {
  const { phoneNumber: phone } = data
  
  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    throw new Error('手机号格式错误')
  }

  return {
    status: 10000,
    message: 'success',
    data: Date.now().toString()
  }
}
