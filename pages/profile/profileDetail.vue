<template>
  <view class="profile-detail-container">
    <!-- 顶部导航栏 -->
    <view class="nav-header">
      <view class="left-btn" @click="goBack">返回</view>
      <text class="header-title">个人信息</text>
      <view class="right-btn"></view>
    </view>
	
	<!-- 用户基本信息 -->
	<view class="user-info">
	  <!-- 头像 -->
	  <view class="avatar-wrapper">
	    <image 
	      v-if="userInfo.image"
	      :src="userInfo.image"
	      class="avatar-image"
	      mode="aspectFill"
	    />
	    <view v-else class="avatar-placeholder">
	      <text>头像</text>
	    </view>
	  </view>

	  <!-- 昵称 -->
	  <view class="nickname-section">
	    <text class="nickname">{{ userInfo.userName || '未设置昵称' }}</text>
	    <text class="nickname-tip">默认微信名称</text>
	  </view>
	</view>

    <!-- 信息展示区域 -->
    <view class="info-section">
      <view class="info-title">个人信息</view>
      
      <view class="info-item">
        <text class="label">年龄</text>
        <text class="value">{{ formatAge(userInfo.birthday || userInfo.age) }}</text>
      </view>

      <view class="info-item">
        <text class="label">所在公司</text>
        <text class="value">{{ userInfo.company || '未填写' }}</text>
      </view>

      <view class="info-item">
        <text class="label">毕业院校</text>
        <text class="value">{{ userInfo.school || '未填写' }}</text>
      </view>

      <view class="info-item">
        <text class="label">职位</text>
        <text class="value">{{ userInfo.position || '未填写' }}</text>
      </view>

      <view class="info-item">
        <text class="label">MBTI</text>
        <text class="value">{{ userInfo.personality || '未填写' }}</text>
      </view>

      <view class="info-item">
        <text class="label">自我介绍</text>
        <text class="value">{{ userInfo.introduction || '未填写' }}</text>
      </view>

      <view class="info-item">
        <text class="label">选择问题</text>
        <text class="value">{{ userInfo.question || '未选择' }}</text>
      </view>

      <view class="info-item">
        <text class="label">我的答案</text>
        <text class="value">{{ userInfo.answer || '未填写' }}</text>
      </view>
    </view>

    <!-- 底部编辑按钮 - 只有查看自己信息时才显示 -->
    <view v-if="!targetUserId" class="bottom-edit-btn" @click="goEdit">
      <text>编辑</text>
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
      targetUserId: null, // 要查看的用户ID，如果为null则查看当前用户
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

  onLoad(options) {
    // 获取页面参数中的用户ID
    this.targetUserId = options.userId || null
    this.loadUserProfile()
  },

  // 添加 onShow 生命周期，确保每次显示页面都重新加载数据
  onShow() {
    // 重新加载用户信息，确保显示最新数据
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

    async loadUserProfile() {
      try {
        // 如果有指定用户ID，则加载指定用户信息，否则加载当前用户信息
        let userId
        if (this.targetUserId) {
          userId = this.targetUserId
        } else {
          userId = await this.userStore.getUserId()
        }
        
        const res = await userApi.getUserProfile(userId)
        if (res.status === 10000 && res.data) {
          this.userInfo = {
            userName: res.data.userName,
            image: normalizeImageForDisplay(res.data.image),
            birthday: res.data.birthday || res.data.age, // 兼容旧数据
            company: res.data.company,
            position: res.data.position,
            school: res.data.school,
            introduction: res.data.introduction,
            personality: res.data.personality,
            question: res.data.question,
            answer: res.data.answer
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
      if (!birthday) return '未填写'
      
      let birthYear
      
      // 处理不同格式的生日数据
      if (typeof birthday === 'string' && birthday.length === 8) {
        // yyyyMMdd格式
        birthYear = parseInt(birthday.slice(0, 4))
      } else if (typeof birthday === 'number' || (!isNaN(birthday) && birthday.toString().length === 4)) {
        // 兼容旧的年份格式
        birthYear = parseInt(birthday)
      } else {
        return birthday
      }
      
      // 按照每5年进行分割，显示年代数字
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
      if (birthYear >= 2015) return '15'
      
      return `${birthYear}年`
    }
  }
}
</script>

<style lang="scss" scoped>
.profile-detail-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 50px;
  position: relative;

  .nav-header {
    background-color: #000;
    color: #fff;
    padding: 44px 16px 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .left-btn, .right-btn {
      font-size: 16px;
    }

    .header-title {
      font-size: 18px;
      font-weight: 500;
    }
  }
  
  .user-info {
    background-color: #fff;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 10px;
  
    .avatar-wrapper {
      width: 80px;
      height: 80px;
      border: 1px solid #e8e8e8;
      border-radius: 50%;
      overflow: hidden;
      flex-shrink: 0;
  
      .avatar-image {
        width: 100%;
        height: 100%;
      }
  
      .avatar-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #999;
        font-size: 14px;
        background-color: #f5f5f5;
      }
    }
  
    .nickname-section {
      flex: 1;
      
      .nickname {
        display: block;
        font-size: 18px;
        color: #333;
        font-weight: 500;
        margin-bottom: 4px;
      }
      
      .nickname-tip {
        font-size: 12px;
        color: #999;
      }
    }
  }

  .info-section {
    background-color: #fff;
    padding: 20px 16px;

    .info-title {
      font-size: 16px;
      color: #333;
      font-weight: 500;
      margin-bottom: 20px;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 16px 0;
      border-bottom: 1px solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      .label {
        font-size: 16px;
        color: #333;
        flex-shrink: 0;
        width: 80px;
      }

      .value {
        font-size: 16px;
        color: #666;
        flex: 1;
        text-align: right;
        word-break: break-all;
        line-height: 1.4;
      }
    }
  }

  .bottom-edit-btn {
    position: fixed;
    bottom: 34px;
    left: 50%;
    transform: translateX(-50%);
    width: 200px;
    height: 44px;
    line-height: 44px;
    background-color: #fff;
    color: #333;
    font-size: 16px;
    border: 1px solid #e8e8e8;
    border-radius: 22px;
    text-align: center;
    z-index: 100;
  }
}
</style>

<style lang="scss" scoped>
.profile-detail-container {
  min-height: 100vh;
  padding-bottom: 112px !important;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.95), transparent 34%),
    radial-gradient(circle at bottom right, rgba(231, 200, 171, 0.72), transparent 32%),
    linear-gradient(160deg, #f7f1eb 0%, #efe2d4 46%, #ead8c6 100%) !important;
  color: #2f241d;
  box-sizing: border-box;
}

.profile-detail-container .nav-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: calc(var(--status-bar-height) + 14px) 18px 14px !important;
  border-bottom: 1px solid rgba(82, 49, 31, 0.1);
  background: rgba(255, 250, 245, 0.88) !important;
  color: #2f241d !important;
  backdrop-filter: blur(18px);
}

.profile-detail-container .left-btn,
.profile-detail-container .right-btn {
  min-width: 54px;
}

.profile-detail-container .left-btn {
  height: 34px;
  line-height: 34px;
  padding: 0 12px;
  border: 1px solid rgba(111, 61, 29, 0.12);
  border-radius: 999px;
  background: #fffaf5;
  box-shadow: 0 8px 18px rgba(111, 61, 29, 0.08);
  color: #6f3d1d;
  font-size: 13px !important;
  font-weight: 900;
  text-align: center;
}

.profile-detail-container .header-title {
  flex: 1;
  color: #2f241d !important;
  font-size: 17px !important;
  font-weight: 900 !important;
  line-height: 1.35;
  text-align: center;
}

.profile-detail-container .user-info,
.profile-detail-container .info-section {
  margin: 18px 18px 0 !important;
  border: 1px solid rgba(82, 49, 31, 0.12);
  border-radius: 22px;
  background: #fffaf5 !important;
  box-shadow: 0 10px 24px rgba(98, 63, 36, 0.06);
}

.profile-detail-container .user-info {
  padding: 18px !important;
}

.profile-detail-container .avatar-wrapper {
  width: 72px !important;
  height: 72px !important;
  border: 0 !important;
  border-radius: 22px !important;
  background: #f4e7dc !important;
  box-shadow: 0 10px 22px rgba(111, 61, 29, 0.12);
}

.profile-detail-container .avatar-placeholder {
  background: #f7eadf !important;
  color: #8a766a !important;
  font-size: 13px !important;
  font-weight: 800;
}

.profile-detail-container .nickname {
  margin-bottom: 6px !important;
  color: #2f241d !important;
  font-size: 20px !important;
  font-weight: 900 !important;
  line-height: 1.25;
}

.profile-detail-container .nickname-tip {
  color: #8a766a !important;
  font-size: 13px !important;
}

.profile-detail-container .info-section {
  padding: 18px !important;
}

.profile-detail-container .info-title {
  margin-bottom: 8px !important;
  color: #2f241d !important;
  font-size: 17px !important;
  font-weight: 900 !important;
  line-height: 1.35;
}

.profile-detail-container .info-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 15px 0 !important;
  border-bottom: 1px solid rgba(82, 49, 31, 0.08) !important;
}

.profile-detail-container .info-item:last-child {
  border-bottom: none !important;
  padding-bottom: 0 !important;
}

.profile-detail-container .label {
  width: 82px !important;
  color: #6f3d1d !important;
  font-size: 14px !important;
  font-weight: 900;
  line-height: 1.5;
}

.profile-detail-container .value {
  flex: 1;
  color: #8a766a !important;
  font-size: 14px !important;
  line-height: 1.6 !important;
  text-align: right;
  word-break: break-word;
}

.profile-detail-container .bottom-edit-btn {
  position: fixed;
  right: 18px;
  bottom: 34px;
  left: 18px !important;
  z-index: 100;
  width: auto !important;
  height: 48px !important;
  line-height: 48px !important;
  transform: none !important;
  border: 0 !important;
  border-radius: 18px !important;
  background: linear-gradient(135deg, #9c5b2e, #6f3d1d) !important;
  box-shadow: 0 14px 26px rgba(111, 61, 29, 0.18);
  color: #ffffff !important;
  font-size: 15px !important;
  font-weight: 900;
  text-align: center;
}
</style>
