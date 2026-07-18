// API 基础配置
const BASE_URL = 'https://www.fry-river-fish.com'

// 发送验证码
export const sendVerificationCode = async (phone) => {
  try {
    const response = await uni.request({
      url: `${BASE_URL}/code/send`,
      method: 'POST',
      data: {
        phoneNumber: phone
      },
      header: {
        'Content-Type': 'application/json'
      }
    })
    return response.data
  } catch (error) {
    throw new Error('发送验证码失败')
  }
}
