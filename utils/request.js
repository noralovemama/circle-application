import config from '@/config'
import * as mockData from '@/mock'

// 创建请求拦截器
const request = async (options) => {
  const { url, method = 'GET', data, mock = false } = options

  // 判断是否使用 mock
  if (config.api.mock.enabled && mock) {
    try {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, config.api.mock.timeout))
      
      // 获取 mock 数据处理函数
      const mockPath = url.replace(/^\//, '').split('/') // 去除开头的'/'并分割路径
      let currentMock = mockData
      
      // 遍历路径获取对应的 mock 处理函数
      for (const path of mockPath) {
        currentMock = currentMock[path]
        if (!currentMock) {
          throw new Error(`未找到 mock 处理函数: ${url}`)
        }
      }

      // 执行 mock 处理函数
      const result = await currentMock(data)
      return result
    } catch (error) {
      throw new Error(error.message || '请求失败')
    }
  }

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