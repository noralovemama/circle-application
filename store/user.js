import { defineStore } from 'pinia'
import { userApi } from '@/request/api'

// 模拟用户数据，用于开发调试
const MOCK_USER = {
  userId: 'user_1',
  userName: '测试用户',
  avatar: '/static/default-avatar.png'
}

export const useUserStore = defineStore('user', {
  state: () => ({
    token: uni.getStorageSync('token') || '',
	expireAt: uni.getStorageSync('expireAt') || '',
	userName: uni.getStorageSync('userName') || '',
    userInfo: {
      userId: '',
      userName: '',
      image: '',
      birthday: '',
      company: '',
      position: '',
      school: '',
      introduction: '',
      personality: '',
      question: '',
      answer: ''
    },
    isLogin: false,
    isLoading: false
  }),

  actions: {
	async setTokenInfo({openId, expireAt}){
		if (openId){
			uni.setStorageSync('token', openId)
			this.token = openId
		}
		if (expireAt){
			uni.setStorageSync('expireAt', expireAt)
			this.expireAt = expireAt
		}
	},
	
	async getOpenId(){
		return uni.getStorageSync('token')
	},
	
	async curUserName(){
		return uni.getStorageSync('userName')
	},
	
	async setUserName(userName){
		if(userName){
			uni.setStorageSync('userName', userName)
		}
	},

    // 检查登录状态
    async checkLoginStatus() {
      try {
		// 1. 不存在token则跳至登陆页面
		if (!this.token || !this.expireAt){
			uni.redirectTo({
			  url: '/pages/login/login'
			})
		}
		// 2. 过期则进行刷新token
		const expired = this.isExpired(this.expireAt)
		if(expired){
			uni.redirectTo({
			  url: '/pages/login/login'
			})
		}
        return false
      } catch (error) {
        this.clearUserInfo()
		uni.redirectTo({
		  url: '/pages/login/login'
		})
        return false
      }
    },
	// 定义一个函数来判断当前时间是否大于 expireAt
	isExpired(expireAt) {
	  // 获取当前时间的时间戳，单位为毫秒
	  const currentTime = Date.now();
	  // 将当前时间戳转换为秒
	  const currentTimeInSeconds = Math.floor(currentTime / 1000);
	  // 比较当前时间（秒）和 expireAt
	  return currentTimeInSeconds > expireAt;
	},
    // 清除用户信息
    clearUserInfo() {
      this.token = ''
      this.userInfo = {}
      this.isLogin = false
      uni.removeStorageSync('token')
	  uni.removeStorageSync('expireAt')
    },

    // 获取用户详情
    async getUserDetail() {
      try {
        const userId = this.token
        if (!userId) {
          throw new Error('用户未登录')
        }
        
        const res = await userApi.getUserProfile(userId)
        if (res.status === 10000 && res.data) {
          this.userInfo = {
            userId: res.data.userId || userId,
            userName: res.data.userName || '',
            image: res.data.image || '',
            birthday: res.data.birthday || res.data.age || '', // 兼容旧数据
            company: res.data.company || '',
            position: res.data.position || '',
            school: res.data.school || '',
            introduction: res.data.introduction || '',
            personality: res.data.personality || '',
            question: res.data.question || '',
            answer: res.data.answer || ''
          }
          this.isLogin = true
          return this.userInfo
        } else {
          throw new Error(res.message || '获取用户信息失败')
        }
      } catch (error) {
        console.error('获取用户详情失败:', error)
        // 如果获取失败，可能是用户信息不存在，但不影响登录状态
        this.isLogin = true
        return null
      }
    },

    // 确保用户信息完整（如果store中没有用户名或头像，则获取）
    async ensureUserInfo() {
      // 检查用户名和头像是否都存在
      if (!this.userInfo.userName || !this.userInfo.image) {
        this.isLoading = true
        try {
          const result = await this.getUserDetail()
          return result
        } finally {
          this.isLoading = false
        }
      }
      return this.userInfo
    },

    // 更新用户信息
    async updateUserInfo(data) {
      // const res = await userApi.updateProfile(data)
      // if (res.code === 0) {
      //   this.userInfo = res.data
      //   return res.data
      // }
      // throw new Error(res.message || '更新失败')
    }
  }
}) 