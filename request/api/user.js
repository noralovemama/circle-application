import request from '../request'
import config from '../config'
import { toSubmittableImageBase64 } from '@/utils/image'
import { firstFilled } from '@/utils/response'

export default {
  // 刷新 token
  refreshToken: (data = {}) => {
    return request({
      url: 'token/refresh',
      method: 'POST',
      data: { code: data.code },
      mock: false
    })
  },

  // 发送验证码
  sendVerificationCode: (phone) => {
    return request({
      url: 'code/send',
      method: 'POST',
      data: { phoneNumber: phone },
      mock: false
    })
  },

  // 验证码登录
  loginWithCode: (phone, validateCode, code) => {
    return request({
      url: 'token/login',
      method: 'POST',
      data: { phoneNumber: phone, validateCode, code },
      mock: false,
      timeout: config.loginTimeout
    })
  },

  // 获取用户信息
  getUserProfile: (userId) => {
    console.log('[API] 获取用户信息')
	const param = {
		userId
	}
    return request({
      url: 'user/detail',
      method: 'GET',
	  data: param,
      mock: false
    })
  },

  // 创建用户信息
  createProfile: (data = {}) => {
    const profileImage = toSubmittableImageBase64(data.image)
    console.log('[API] 创建用户信息:', {
      ...data,
      image: profileImage ? `[base64:${String(profileImage).length}]` : ''
    })
    return request({
      url: 'user/update',
      method: 'POST',
      data: {
        userName: data.userName,
        image: profileImage,
        birthday: data.birthday,
        company: data.company,
        position: data.position,
        school: data.school,
        introduction: data.introduction,
        personality: data.personality,
        question: data.question,
        answer: data.answer,
        userId: data.userId
      },
      mock: false
    })
  },

  // 更新用户信息
  updateProfile: (data = {}, userId, userName, image) => {
    const profileImage = toSubmittableImageBase64(firstFilled(data.image, image))
    console.log('[API] 更新用户信息:', {
      ...data,
      image: profileImage ? `[base64:${String(profileImage).length}]` : ''
    })
    return request({
      url: 'user/update',
      method: 'POST',
      data: {
        image: profileImage,
        userName: firstFilled(data.userName, userName),
        birthday: data.birthday,
        company: data.company,
        position: data.position,
        school: data.school,
        introduction: data.introduction,
        personality: data.personality,
        question: data.question,
        answer: data.answer,
		userId
      },
      mock: false
    })
  }
}
