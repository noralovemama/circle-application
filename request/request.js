import config from './config'
import { findMockFunction } from './mock'
import { getResponseStatus } from '@/utils/response'

const AUTH_FREE_URLS = ['token/login', 'code/send', 'token/refresh']

const normalizeUrl = (url = '') => String(url).replace(/^\/+/, '').split('?')[0]

const shouldAttachUserToken = (url = '') => AUTH_FREE_URLS.indexOf(normalizeUrl(url)) === -1

const shouldUseDevMock = () => {
  // #ifdef MP-WEIXIN
  try {
    const systemInfo = uni.getSystemInfoSync()
    return !!(config.mock && config.mock.enabled && systemInfo && systemInfo.platform === 'devtools')
  } catch (error) {
    return !!(config.mock && config.mock.enabled)
  }
  // #endif

  return false
}

const getErrorMessage = (error, fallback = '网络请求失败') => {
  if (!error) return fallback
  if (typeof error === 'string') return error
  return error.message || error.errMsg || error.msg || fallback
}

const sanitizeLogData = (value) => {
  if (!value || typeof value !== 'object') return value
  const result = Array.isArray(value) ? [] : {}
  Object.keys(value).forEach((key) => {
    const item = value[key]
    if (typeof item === 'string' && (key.toLowerCase().indexOf('image') !== -1 || item.indexOf('data:image/') === 0)) {
      result[key] = `[image:${item.length}]`
    } else if (item && typeof item === 'object') {
      result[key] = sanitizeLogData(item)
    } else {
      result[key] = item
    }
  })
  return result
}

const normalizeResponseData = (data) => {
  if (!data || typeof data !== 'object') return data
  const normalizedStatus = getResponseStatus(data)
  if (normalizedStatus !== undefined) {
    data.status = normalizedStatus
  }
  if ((data.message === undefined || data.message === null || data.message === '') && data.msg) {
    data.message = data.msg
  }
  return data
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
          statusCode: response && response.statusCode,
          dataStatus: response && response.data ? (response.data.status !== undefined ? response.data.status : response.data.code) : undefined,
          dataMessage: (response && response.data && (response.data.message || response.data.msg)) || ''
        })
        resolve(response)
      },
      fail: (error) => {
        markFinished()
        console.error('[Request] fail:', {
          url: requestOptions.url,
          duration: Date.now() - requestStartTime,
          errMsg: error && error.errMsg,
          message: error && error.message,
          code: error && error.code
        })
        reject(error)
      },
      complete: (result) => {
        console.log('[Request] complete:', {
          url: requestOptions.url,
          duration: Date.now() - requestStartTime,
          errMsg: result && result.errMsg,
          statusCode: result && result.statusCode
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
  const useMock = mock || shouldUseDevMock()

  console.log('[Request] 开始请求:', { url, method, data: sanitizeLogData(data), mock: useMock })

  if (useMock) {
    try {
      console.log('[Mock] 开始查找 mock 函数:', url)
      const result = await findMockFunction(url, data)
      console.log('[Mock] 执行结果:', result)
      
      // 检查返回数据格式
      if (!result || typeof result !== 'object') {
        console.error('[Mock] 返回数据格式错误:', result)
        throw new Error('返回数据格式错误')
      }

      return normalizeResponseData(result)
    } catch (error) {
      console.error('[Mock] 处理错误:', error)
      throw error
    }
  }

  // 真实请求
  const requestStartTime = Date.now()
  try {
    const token = uni.getStorageSync('token') || ''
    const openId = uni.getStorageSync('openId') || token
    const expireAt = uni.getStorageSync('expireAt') || ''
    const attachUserToken = shouldAttachUserToken(url) && !!openId
    const header = {
      'Content-Type': 'application/json'
    }
    if (attachUserToken) {
      header['User-Token'] = JSON.stringify({ openId, expireAt })
    }
    const requestOptions = {
      url: `${config.baseUrl}${url}`,
      method,
      data,
      timeout: timeout || config.timeout,
      dataType: 'json',
      header
    }

    console.log('[Request] 实际请求:', {
      url: requestOptions.url,
      method: requestOptions.method,
      timeout: requestOptions.timeout,
      dataKeys: data && typeof data === 'object' ? Object.keys(data) : [],
      attachUserToken,
      tokenTail: openId ? `****${String(openId).slice(-4)}` : ''
    })

    const response = await requestByCallback(requestOptions, requestStartTime)
    if (!response || response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error((response && response.data && (response.data.message || response.data.msg)) || `HTTP ${response && response.statusCode}`)
    }

    if (!response.data) {
      throw new Error('接口返回为空')
    }

    const responseData = normalizeResponseData(response.data)
    const { status, message, msg } = responseData
    if (status == 10002) {
      uni.redirectTo({
        url: '/pages/login/login'
      })
      throw new Error(message || msg || '登录已过期，请重新登录')
    } else if (status == 10001) {
      throw new Error(message || msg || '请求失败')
    }
    return responseData
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

export default request
