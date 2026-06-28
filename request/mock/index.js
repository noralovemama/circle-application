import * as user from './user/index'
import * as circle from './circle/index'
import { generateMockList } from './circle/index'
import { getCircleDetail } from './circle/detail'
import { createCircle } from './circle/create'
import { updateCircle } from './circle/update'
import { getUserProfile, createProfile, updateProfile } from './user/profile'
import { refreshToken } from './user/refresh-token'
import { sendCode, login } from './user/index.js';

// 导出所有模块的mock数据
export const mockData = {
  circle,
  user
}

// Mock 处理函数映射表
const mockMap = {
  'circle/page': (params) => generateMockList(params),
  'circle/detail': (params) => getCircleDetail(params),
  'circle/create': (params) => createCircle(params),
  'circle/update': (params) => updateCircle(params),
  'user/detail': (params) => getUserProfile(params),
  'user/update': (params) => updateProfile(params),
  'token/refresh': (params) => refreshToken(params),
  'code/send': (params) => sendCode(params),
  'token/login': (params) => login(params),
}

// 查找并执行对应的 mock 函数
export const findMockFunction = (url, params) => {
  console.log('[Mock] 查找处理函数:', url, params)
  
  const mockFn = mockMap[url]
  if (!mockFn) {
    console.log('[Mock] 未找到处理函数:', url)
    throw new Error(`未找到 mock 处理函数: ${url}`)
  }

  try {
    console.log('[Mock] 执行处理函数:', url, params)
    return mockFn(params)
  } catch (error) {
    console.error('[Mock] 处理函数执行错误:', error)
    throw error
  }
} 
