import config from '@/config'

// 创建请求拦截器
const request = async (options) => {
  const { url, method = 'GET', data } = options

  // 真实请求
  try {
    const response = await uni.request({
      url: `${config.api.baseUrl}${url}`,
      method,
      data,
      timeout: config.api.timeout,
      header: {
        'Content-Type': 'application/json'
      }
    })
    return response.data
  } catch (error) {
    throw new Error(error.message || '请求失败')
  }
}

export default request
