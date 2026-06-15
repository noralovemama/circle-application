import { defineStore } from 'pinia'
import { userApi } from '@/request/api'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: uni.getStorageSync('token') || '',
	openId: uni.getStorageSync('openId') || uni.getStorageSync('token') || '',
	userId: uni.getStorageSync('userId') || uni.getStorageSync('token') || '',
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
	pickFirst(...values) {
		for (let index = 0; index < values.length; index += 1) {
			const value = values[index]
			if (value !== undefined && value !== null && value !== '') return value
		}
		return undefined
	},

	normalizeExpireAt(value) {
		const nowSeconds = Math.floor(Date.now() / 1000)
		const fallbackExpireAt = nowSeconds + 7 * 24 * 60 * 60
		if (value === undefined || value === null || value === '') return fallbackExpireAt

		const normalizeNumber = (rawValue) => {
			const numericValue = Number(rawValue)
			if (!isFinite(numericValue) || numericValue <= 0) return fallbackExpireAt

			if (numericValue > 1000000000000) {
				return Math.floor(numericValue / 1000)
			}

			if (numericValue > nowSeconds) {
				return Math.floor(numericValue)
			}

			if (numericValue <= 365 * 24 * 60 * 60) {
				return nowSeconds + Math.floor(numericValue)
			}

			return Math.floor(numericValue)
		}

		if (typeof value === 'number') {
			return normalizeNumber(value)
		}

		if (typeof value === 'string' && /^\d+$/.test(value)) {
			return normalizeNumber(value)
		}

		const expireDate = new Date(String(value).replace(/-/g, '/'))
		if (!isNaN(expireDate.getTime())) {
			return Math.floor(expireDate.getTime() / 1000)
		}

		return fallbackExpireAt
	},
	async setTokenInfo(loginData = {}){
		const userInfo = loginData.userInfo || loginData.user || loginData.profile || {}
		const openIdValue = this.pickFirst(
			loginData.openId,
			loginData.openid,
			loginData.openID,
			userInfo.openId,
			userInfo.openid,
			userInfo.openID
		)
		const userIdValue = this.pickFirst(
			loginData.userId,
			loginData.userID,
			loginData.uid,
			loginData.id,
			userInfo.userId,
			userInfo.userID,
			userInfo.uid,
			userInfo.id,
			openIdValue
		)
		const tokenValue = this.pickFirst(
			openIdValue,
			loginData.token,
			loginData.accessToken,
			loginData.access_token,
			userInfo.token,
			userInfo.accessToken,
			userIdValue
		)
		const expireAtValue = this.normalizeExpireAt(this.pickFirst(
			loginData.expireAt,
			loginData.expireTime,
			loginData.expiresAt,
			loginData.expiresIn,
			userInfo.expireAt,
			userInfo.expireTime,
			userInfo.expiresAt,
			userInfo.expiresIn
		))

		if (!tokenValue || !userIdValue) {
			return false
		}

		uni.setStorageSync('token', tokenValue)
		uni.setStorageSync('openId', openIdValue || tokenValue)
		uni.setStorageSync('userId', userIdValue)
		uni.setStorageSync('expireAt', expireAtValue)

		this.token = tokenValue
		this.openId = openIdValue || tokenValue
		this.userId = userIdValue
		this.expireAt = expireAtValue
		this.isLogin = true
		return true
	},

	async getOpenId(){
		return this.openId || uni.getStorageSync('openId') || this.token || uni.getStorageSync('token')
	},

	async getUserId(){
		return this.userId || uni.getStorageSync('userId') || this.openId || uni.getStorageSync('openId') || this.token || uni.getStorageSync('token')
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
        this.token = uni.getStorageSync('token') || this.token
        this.openId = uni.getStorageSync('openId') || this.openId || this.token
        this.userId = uni.getStorageSync('userId') || this.userId || this.openId || this.token
        this.expireAt = uni.getStorageSync('expireAt') || this.expireAt

        const normalizedExpireAt = this.normalizeExpireAt(this.expireAt)

        if (!this.token || !this.userId || !this.expireAt || this.isExpired(normalizedExpireAt)) {
          this.clearUserInfo()
          this.redirectToLogin()
          return false
        }

        this.expireAt = normalizedExpireAt
        uni.setStorageSync('openId', this.openId)
        uni.setStorageSync('userId', this.userId)
        uni.setStorageSync('expireAt', this.expireAt)
        this.isLogin = true
        return true
      } catch (error) {
        this.clearUserInfo()
        this.redirectToLogin()
        return false
      }
    },
	// 定义一个函数来判断当前时间是否大于 expireAt
	isExpired(expireAt) {
	  const expireAtSeconds = this.normalizeExpireAt(expireAt)
	  const currentTimeInSeconds = Math.floor(Date.now() / 1000)
	  return currentTimeInSeconds > expireAtSeconds
	},

	redirectToLogin() {
	  const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : []
	  const currentPage = pages[pages.length - 1]
	  if (currentPage && currentPage.route === 'pages/login/login') return
	  uni.redirectTo({
	    url: '/pages/login/login'
	  })
	},
    // 清除用户信息
    clearUserInfo() {
      this.token = ''
      this.openId = ''
      this.userId = ''
      this.expireAt = ''
      this.userInfo = {
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
      }
      this.isLogin = false
      uni.removeStorageSync('token')
	  uni.removeStorageSync('openId')
	  uni.removeStorageSync('userId')
	  uni.removeStorageSync('expireAt')
	  uni.removeStorageSync('userName')
    },

    // 获取用户详情
    async getUserDetail() {
      try {
        const userId = await this.getUserId()
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
        if (error && String(error.message || error).indexOf('登录') !== -1) {
          this.isLogin = false
        }
        return null
      }
    },

    setUserProfile(profile = {}) {
      const nextUserInfo = {
        userId: profile.userId || this.userInfo.userId || this.userId || uni.getStorageSync('userId') || '',
        userName: profile.userName || '',
        image: profile.image || '',
        birthday: profile.birthday || profile.age || '',
        company: profile.company || '',
        position: profile.position || '',
        school: profile.school || '',
        introduction: profile.introduction || '',
        personality: profile.personality || '',
        question: profile.question || '',
        answer: profile.answer || ''
      }
      this.userInfo = nextUserInfo
      this.userName = nextUserInfo.userName
      if (nextUserInfo.userName) {
        uni.setStorageSync('userName', nextUserInfo.userName)
      }
      this.isLogin = true
      return this.userInfo
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
