// 全局配置
export default {
  // API配置
  api: {
    baseUrl: 'https://your-api-domain.com/api',
    timeout: 10000,
    mock: {
      enabled: true, // 是否启用 mock
      timeout: 1000, // mock 接口延迟时间
    }
  }
} 