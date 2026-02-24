import jwt from 'jsonwebtoken'

// API 基础配置
const BASE_URL = 'https://your-api-domain.com/api'
const SECRET_KEY = 'your-secret-key' // JWT密钥

// 生成JWT token
const generateToken = (openid) => {
  const expireTime = Math.floor(Date.now() / 1000) + 7200 // 2小时后过期
  return jwt.sign(
    { 
      openid,
      exp: expireTime
    },
    SECRET_KEY
  )
}

// 发送验证码
export const sendVerificationCode = async (phone) => {
  try {
    const token = generateToken('temp_openid') // 临时openid，实际应该从登录后获取
    const response = await uni.request({
      url: `${BASE_URL}/send-code`,
      method: 'POST',
      data: {
        phone
      },
      header: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    return response.data
  } catch (error) {
    throw new Error('发送验证码失败')
  }
} 