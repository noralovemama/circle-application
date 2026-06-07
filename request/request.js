import config from './config'
import { findMockFunction } from './mock'
import store from '@/store'

const AUTH_FREE_URLS = ['token/login', 'code/send', 'token/refresh']

const normalizeUrl = (url = '') => String(url).replace(/^\/+/, '').split('?')[0]

const shouldAttachUserToken = (url = '') => !AUTH_FREE_URLS.includes(normalizeUrl(url))

const getErrorMessage = (error, fallback = '网络请求失败') => {
  if (!error) return fallback
  if (typeof error === 'string') return error
  return error.message || error.errMsg || error.msg || fallback
}

const requestByCallback = (requestOptions, requestStartTime) => {
  return new Promise((resolve, reject) => {
    let finished = false
    const markFinished = () => {
      finished = true
    }

    uni.request({
      ...requestOptions,
      success: (response) => {
        markFinished()
        console.log('[Request] success:', {
          url: requestOptions.url,
          duration: Date.now() - requestStartTime,
          statusCode: response?.statusCode,
          dataStatus: response?.data?.status ?? response?.data?.code,
          dataMessage: response?.data?.message || response?.data?.msg || ''
        })
        resolve(response)
      },
      fail: (error) => {
        markFinished()
        console.error('[Request] fail:', {
          url: requestOptions.url,
          duration: Date.now() - requestStartTime,
          errMsg: error?.errMsg,
          message: error?.message,
          code: error?.code
        })
        reject(error)
      },
      complete: (result) => {
        console.log('[Request] complete:', {
          url: requestOptions.url,
          duration: Date.now() - requestStartTime,
          errMsg: result?.errMsg,
          statusCode: result?.statusCode
        })
      }
    })

    setTimeout(() => {
      if (!finished) {
        markFinished()
        const error = new Error(`${requestOptions.url}无返回`)
        console.error('[Request] pending超过配置超时仍未回调:', {
          url: requestOptions.url,
          timeout: requestOptions.timeout,
          duration: Date.now() - requestStartTime
        })
        reject(error)
      }
    }, requestOptions.timeout + 1000)
  })
}

// 创建请求拦截器
const request = async (options) => {
  const { url, method = 'GET', data, mock = false, timeout } = options

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
  const requestStartTime = Date.now()
  try {
    const token = uni.getStorageSync('token') || ''
    const expireAt = uni.getStorageSync('expireAt') || ''
    const attachUserToken = shouldAttachUserToken(url) && !!token
    const requestOptions = {
      url: `${config.baseUrl}${url}`,
      method,
      data,
      timeout: timeout || config.timeout,
      dataType: 'json',
      header: {
        'Content-Type': 'application/json',
        ...(attachUserToken && { 'User-Token': JSON.stringify({ openId: token, expireAt }) }),
      }
    }

    console.log('[Request] 实际请求:', {
      url: requestOptions.url,
      method: requestOptions.method,
      timeout: requestOptions.timeout,
      dataKeys: data && typeof data === 'object' ? Object.keys(data) : [],
      attachUserToken,
      tokenTail: token ? `****${String(token).slice(-4)}` : ''
    })

    const response = await requestByCallback(requestOptions, requestStartTime)
    const { status, message, msg } = response?.data || {}
    if (status == 10002) {
      uni.redirectTo({
        url: '/pages/login/login'
      })
      throw new Error(message || msg || '登录已过期，请重新登录')
    } else if (status == 10001) {
      throw new Error(message || msg || '请求失败')
    }
    return response.data
  } catch (error) {
    console.error('[Request] 请求错误:', {
      url: `${config.baseUrl}${url}`,
      method,
      duration: Date.now() - requestStartTime,
      message: getErrorMessage(error),
      error
    })
    throw new Error(getErrorMessage(error))
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
