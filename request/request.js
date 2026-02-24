import config from './config'
import { findMockFunction } from './mock'
import store from '@/store'

// 创建请求拦截器
const request = async (options) => {
  const { url, method = 'GET', data, mock = false } = options

  console.log('[Request] 开始请求:', { url, method, data, mock })

  // 强制开启 mock
  if (mock) {
    try {
      console.log('[Mock] 开始查找 mock 函数:', url)
      const result = await findMockFunction(url, data)
      console.log('[Mock] 执行结果:', result)
      
      // 检查返回数据格式
      if (!result || typeof result !== 'object') {
        console.error('[Mock] 返回数据格式错误:', result)
        throw new Error('返回数据格式错误')
      }

      return result
    } catch (error) {
      console.error('[Mock] 处理错误:', error)
      throw error
    }
  }

  // 真实请求
  try {
	const token = await uni.getStorageSync('token') || ''
	const expireAt = await uni.getStorageSync('expireAt') || ''
    const requestOptions = {
      url: `${config.baseUrl}${url}`,
      method,
      data,
      timeout: config.timeout,
      header: {
        'Content-Type': 'application/json',
        // ...(token && { 'Authorization': `Bearer ${token}` })
		...(token && { 'User-Token': JSON.stringify({'openId': token, 'expireAt': expireAt}) }),
      }
    }

    const response = await uni.request(requestOptions)
	const { status, message } = response?.data
	if (status == 10002){
		uni.redirectTo({
		  url: '/pages/login/login'
		})
	}else if (status == 10001){
		throw new Error(message)
	}
    return response.data
  } catch (error) {
    console.error('[Request] 请求错误:', error)
    throw error
  }
}

// 响应拦截器
const responseInterceptor = (response) => {
  if (response.statusCode === 401) {
    // token 失效，清除用户信息
    store.commit('user/CLEAR_USER_INFO')
    uni.redirectTo({
      url: '/pages/login/login'
    })
    return Promise.reject(new Error('登录已过期'))
  }
  return response
}

export default request 