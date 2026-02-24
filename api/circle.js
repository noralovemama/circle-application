import request from '@/utils/request'
import { isMock } from '@/utils/env'

// Mock data for development
const mockCreateCircle = (data) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() > 0.1) { // 90% success rate
        resolve({ code: 0, message: 'success' })
      } else {
        reject(new Error('模拟创建失败'))
      }
    }, 1000)
  })
}

export const createCircle = async (data) => {
  if (isMock) {
    return mockCreateCircle(data)
  }
  
  return request({
    url: '/api/circle/create',
    method: 'POST',
    data
  })
} 