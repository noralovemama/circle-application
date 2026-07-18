<template>
  <view class="profile-detail-container">
    <view class="nav-header">
      <view class="left-btn" @click="goBack">返回</view>
      <text class="header-title">{{ pageTitle }}</text>
      <view class="right-placeholder"></view>
    </view>

    <view class="hero-card">
      <view class="avatar-shell">
        <image
          v-if="userInfo.image"
          :src="userInfo.image"
          class="avatar-image"
          mode="aspectFill"
        />
        <view v-else class="avatar-placeholder">
          <text>{{ displayInitial }}</text>
        </view>
      </view>

      <view class="hero-copy">
        <text class="hero-name">{{ displayName }}</text>
        <text class="hero-subtitle">{{ heroSubtitle }}</text>
      </view>
    </view>

    <view class="info-card">
      <view class="section-head">
        <text class="section-title">基本信息</text>
        <text class="section-desc">别人会先看到这些资料</text>
      </view>

      <view class="info-item" v-for="item in basicInfoItems" :key="item.label">
        <text class="label">{{ item.label }}</text>
        <text class="value">{{ item.value }}</text>
      </view>
    </view>

    <view class="info-card">
      <view class="section-head">
        <text class="section-title">更多介绍</text>
        <text class="section-desc">补充你的个性、经历和表达</text>
      </view>

      <view class="stack-item">
        <text class="stack-label">自我介绍</text>
        <text class="stack-value">{{ displayText(userInfo.introduction, '还没有填写自我介绍') }}</text>
      </view>

      <view class="stack-item">
        <text class="stack-label">我想回答的问题</text>
        <text class="stack-value">{{ displayText(userInfo.question, '还没有选择问题') }}</text>
      </view>

      <view class="stack-item">
        <text class="stack-label">我的答案</text>
        <text class="stack-value">{{ displayText(userInfo.answer, '还没有填写答案') }}</text>
      </view>
    </view>

    <view v-if="!targetUserId" class="bottom-edit-btn" @click="goEdit">
      <text>编辑我的资料</text>
    </view>
  </view>
</template>

<script>
import userApi from '@/request/api/user'
import { useUserStore } from '@/store/user'
import { normalizeImageForDisplay } from '@/utils/image'

export default {
  setup() {
    const userStore = useUserStore()
    return {
      userStore
    }
  },

  data() {
    return {
      targetUserId: null,
      userInfo: {
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
    }
  },

  computed: {
    pageTitle() {
      return this.targetUserId ? 'TA 的资料' : '我的资料'
    },
    displayName() {
      return this.displayText(this.userInfo.userName, '还没设置昵称')
    },
    displayInitial() {
      const name = String(this.userInfo.userName || '').trim()
      return name ? name.slice(0, 1) : '我'
    },
    heroSubtitle() {
      if (this.targetUserId) {
        return '先看看对方写了什么，再决定要不要认识'
      }
      return '这是别人决定要不要认识你的第一眼'
    },
    basicInfoItems() {
      return [
        { label: '年龄段', value: this.formatAge(this.userInfo.birthday || this.userInfo.age) },
        { label: '所在公司', value: this.displayText(this.userInfo.company, '暂未填写') },
        { label: '毕业院校', value: this.displayText(this.userInfo.school, '暂未填写') },
        { label: '职位', value: this.displayText(this.userInfo.position, '暂未填写') },
        { label: 'MBTI', value: this.displayText(this.userInfo.personality, '暂未填写') }
      ]
    }
  },

  onLoad(options) {
    this.targetUserId = options.userId || null
    this.loadUserProfile()
  },

  onShow() {
    this.loadUserProfile()
  },

  methods: {
    goBack() {
      const pages = getCurrentPages()
      if (pages.length > 1) {
        uni.navigateBack()
      } else {
        uni.switchTab({
          url: '/pages/user/user'
        })
      }
    },

    goEdit() {
      uni.navigateTo({
        url: '/pages/profile/profileNew'
      })
    },

    displayText(value, fallback = '未填写') {
      const text = String(value || '').trim()
      return text || fallback
    },

    async loadUserProfile() {
      try {
        const isLoggedIn = await this.userStore.checkLoginStatus()
        if (!isLoggedIn) return

        const userId = this.targetUserId || await this.userStore.getUserId()

        const res = await userApi.getUserProfile(userId)
        if (res.status === 10000 && res.data) {
          this.userInfo = {
            userName: res.data.userName || '',
            image: normalizeImageForDisplay(res.data.image),
            birthday: res.data.birthday || res.data.age || '',
            company: res.data.company || '',
            position: res.data.position || '',
            school: res.data.school || '',
            introduction: res.data.introduction || '',
            personality: res.data.personality || '',
            question: res.data.question || '',
            answer: res.data.answer || ''
          }
        }
      } catch (error) {
        console.log('加载用户信息失败:', error)
        uni.showToast({
          title: '加载信息失败',
          icon: 'none'
        })
      }
    },

    formatAge(birthday) {
      if (!birthday) return '暂未填写'

      let birthYear

      if (typeof birthday === 'string' && birthday.length === 8) {
        birthYear = parseInt(birthday.slice(0, 4))
      } else if (typeof birthday === 'number' || (!isNaN(birthday) && birthday.toString().length === 4)) {
        birthYear = parseInt(birthday)
      } else {
        return birthday
      }

      if (birthYear >= 1960 && birthYear < 1965) return '60后'
      if (birthYear >= 1965 && birthYear < 1970) return '65后'
      if (birthYear >= 1970 && birthYear < 1975) return '70后'
      if (birthYear >= 1975 && birthYear < 1980) return '75后'
      if (birthYear >= 1980 && birthYear < 1985) return '80后'
      if (birthYear >= 1985 && birthYear < 1990) return '85后'
      if (birthYear >= 1990 && birthYear < 1995) return '90后'
      if (birthYear >= 1995 && birthYear < 2000) return '95后'
      if (birthYear >= 2000 && birthYear < 2005) return '00后'
      if (birthYear >= 2005 && birthYear < 2010) return '05后'
      if (birthYear >= 2010 && birthYear < 2015) return '10后'
      if (birthYear >= 2015) return '15后'

      return `${birthYear}年`
    }
  }
}
</script>

<style lang="scss" scoped>
.profile-detail-container {
  min-height: 100vh;
  padding-bottom: 112px;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.95), transparent 34%),
    radial-gradient(circle at bottom right, rgba(216, 194, 174, 0.68), transparent 34%),
    linear-gradient(160deg, #f7f3ee 0%, #efe4d8 48%, #e6d7c8 100%);
  color: #30261f;
  box-sizing: border-box;
}

.nav-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: calc(var(--status-bar-height) + 10px) 16px 12px;
  border-bottom: 1px solid rgba(82, 49, 31, 0.1);
  background: rgba(255, 250, 245, 0.88);
  backdrop-filter: blur(18px);
}

.left-btn {
  min-width: 52px;
  height: 30px;
  line-height: 30px;
  padding: 0 10px;
  border: 1px solid rgba(111, 61, 29, 0.1);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 4px 12px rgba(111, 61, 29, 0.05);
  color: #7b5f48;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
}

.header-title {
  flex: 1;
  font-size: 17px;
  font-weight: 800;
  line-height: 30px;
  text-align: center;
  letter-spacing: -0.2px;
}

.right-placeholder {
  width: 52px;
}

.hero-card,
.info-card {
  margin: 20px 20px 0;
  border: 1px solid rgba(82, 49, 31, 0.12);
  border-radius: 24px;
  background: rgba(255, 250, 245, 0.96);
  box-shadow: 0 10px 24px rgba(103, 77, 58, 0.06);
}

.hero-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 20px;
}

.avatar-shell {
  width: 76px;
  height: 76px;
  border-radius: 24px;
  overflow: hidden;
  background: linear-gradient(180deg, #efe2d7 0%, #e4d0be 100%);
  box-shadow: 0 10px 22px rgba(111, 84, 63, 0.12);
  flex-shrink: 0;
}

.avatar-image,
.avatar-placeholder {
  width: 100%;
  height: 100%;
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #7d6a5c;
  font-size: 28px;
  font-weight: 900;
}

.hero-copy {
  flex: 1;
  min-width: 0;
}

.hero-name {
  display: block;
  font-size: 24px;
  font-weight: 900;
  line-height: 32px;
  color: #30261f;
}

.hero-subtitle {
  display: block;
  margin-top: 8px;
  font-size: 14px;
  line-height: 22px;
  color: #7d6a5c;
}

.info-card {
  padding: 20px;
}

.section-head {
  margin-bottom: 12px;
}

.section-title {
  display: block;
  font-size: 18px;
  font-weight: 900;
  line-height: 26px;
  color: #30261f;
}

.section-desc {
  display: block;
  margin-top: 4px;
  font-size: 13px;
  line-height: 20px;
  color: #7d6a5c;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 18px;
  padding: 18px 0;
  border-bottom: 1px solid rgba(82, 49, 31, 0.08);
}

.info-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.label {
  width: 88px;
  flex-shrink: 0;
  color: #7b5f48;
  font-size: 15px;
  font-weight: 900;
  line-height: 24px;
}

.value {
  flex: 1;
  color: #7d6a5c;
  font-size: 15px;
  line-height: 24px;
  text-align: right;
  word-break: break-word;
}

.stack-item {
  padding: 18px 0;
  border-bottom: 1px solid rgba(82, 49, 31, 0.08);
}

.stack-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.stack-label {
  display: block;
  font-size: 15px;
  font-weight: 900;
  line-height: 24px;
  color: #7b5f48;
}

.stack-value {
  display: block;
  margin-top: 8px;
  color: #7d6a5c;
  font-size: 15px;
  line-height: 24px;
  white-space: pre-wrap;
  word-break: break-word;
}

.bottom-edit-btn {
  position: fixed;
  right: 20px;
  bottom: 34px;
  left: 20px;
  z-index: 100;
  height: 48px;
  line-height: 48px;
  border-radius: 18px;
  background: linear-gradient(135deg, #8c664c 0%, #72513b 100%);
  box-shadow: 0 14px 26px rgba(94, 70, 52, 0.18);
  color: #ffffff;
  font-size: 15px;
  font-weight: 900;
  text-align: center;
}
</style>
