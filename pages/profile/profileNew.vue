<template>
  <view class="profile-container">
    <!-- 顶部导航栏 -->
    <view class="nav-header">
      <view class="left-btn" @click="goBack">返回</view>
      <text class="header-title">个人信息</text>
      <view class="right-placeholder"></view>
    </view>
	
	<!-- 用户基本信息 -->
	<view class="user-info">
	  <!-- 头像选择 -->
	  <button 
	    class="avatar-wrapper"
	    open-type="chooseAvatar" 
	    @chooseavatar="onChooseAvatar"
	  >
	    <image 
	      v-if="tempUserInfo.avatar"
	      :src="tempUserInfo.avatar"
	      class="avatar-image"
	      mode="aspectFill"
	    />
	    <view v-else class="avatar-placeholder">
	      <text>头像</text>
	    </view>
	  </button>
	
	  <!-- 昵称输入 -->
	  <input 
	    type="nickname"
	    v-model="tempUserInfo.nickname"
	    :placeholder="showNicknameTip ? '请输入昵称' : defaultNickname"
	    @input="onNicknameInput"
	    @change="onNicknameChange"
	    class="nickname-input"
	    :class="{ 'highlight': showNicknameTip }"
	  />
	</view>
	
	<!-- 提示信息 -->
	<view v-if="showNicknameTip" class="tip-text">
	  请设置昵称
	</view>

    <!-- 表单区域 -->
    <view class="form-section">
      <view class="form-title">请填写基本信息</view>
      <view class="form-tip">如实填写</view>
      
      <view class="form-item">
        <text class="label">昵称<text class="required">*</text></text>
        <input 
          class="input" 
          v-model="tempUserInfo.nickname" 
          @input="onNicknameInput"
          placeholder="默认微信名称"
        />
      </view>

      <view class="form-item">
        <text class="label">出生年月<text class="required">*</text></text>
        <picker 
          mode="date" 
          :value="birthdayDate"
          @change="onBirthdayChange"
        >
          <view class="picker-value">
            {{ formatBirthdayDisplay() || '请选择出生年月日' }}
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">所在公司<text class="required">*</text></text>
        <input 
          class="input" 
          v-model="formData.company" 
          @input="onFieldInput('company', $event)"
          placeholder="请输入公司名称"
        />
      </view>

      <view class="form-item">
        <text class="label">毕业院校<text class="required">*</text></text>
        <input 
          class="input" 
          v-model="formData.school" 
          @input="onFieldInput('school', $event)"
          placeholder="请输入毕业院校"
        />
      </view>

      <view class="form-item">
        <text class="label">职位</text>
        <input 
          class="input" 
          v-model="formData.position" 
          @input="onFieldInput('position', $event)"
          placeholder="请输入职位"
        />
      </view>

      <view class="form-item">
        <text class="label">MBTI</text>
        <picker 
          mode="selector" 
          :range="mbtiOptions" 
          :value="mbtiIndex"
          @change="onMbtiChange"
        >
          <view class="picker-value">
            {{ formData.personality || '请选择MBTI类型' }}
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">自我介绍</text>
        <textarea 
          class="textarea" 
		  maxlength="3000"
          v-model="formData.introduction" 
          @input="onFieldInput('introduction', $event)"
          placeholder="介绍一下自己吧"
        />
      </view>

      <view class="form-item">
        <text class="label">选择问题</text>
        <picker 
          mode="selector" 
          :range="questionOptions" 
          :value="questionIndex"
          @change="onQuestionChange"
        >
          <view class="picker-value">
            {{ formData.question || '请选择一个问题' }}
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">我的答案</text>
        <textarea 
          class="textarea" 
          maxlength="500"
          v-model="formData.answer" 
          @input="onFieldInput('answer', $event)"
          placeholder="回答你选择的问题"
        />
      </view>
    </view>

    <!-- 保存按钮 -->
    <button 
      class="save-btn" 
      :class="{ 'save-btn-disabled': isSaving }"
      @click="saveProfile" 
      :disabled="isSaving"
    >{{ isSaving ? '保存中...' : '保存' }}</button>
  </view>
</template>

<script>
import userApi from '@/request/api/user'
import { useUserStore } from '@/store/user'
import {
  isDataUrlImage,
  isLocalImagePath,
  isRemoteImageUrl,
  normalizeImageForDisplay,
  toSubmittableImageBase64
} from '@/utils/image'

// 确保页面被正确引用
console.log('profileNew页面已加载')

export default {
  setup() {
    const userStore = useUserStore()
    return {
      userStore
    }
  },

  data() {
    return {
	  defaultNickname: '用户名XXX',
	  tempUserInfo: {
	    avatar: '',
	    nickname: '',
		avatarBase64: ''
	  },
	  showNicknameTip: false,
      formData: {
        birthday: '',
        company: '',
        position: '',
        school: '',
        introduction: '',
        personality: '',
        question: '',
        answer: ''
      },
      birthdayDate: '',
      mbtiOptions: [
        'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
        'ISTP', 'ISFP', 'INFP', 'INTP',
        'ESTP', 'ESFP', 'ENFP', 'ENTP',
        'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ'
      ],
      mbtiIndex: 0,
      questionOptions: [
        '如果让别人记住你一个点，你希望是什么？',
        '你生命中最骄傲的一件事是什么？',
        '你最不能接受别人的什么行为？',
        '别人第一次见你，最常说的第一句话是什么？',
        '一句你经常对自己说的话？',
        '你觉得自己身上最矛盾的一点是什么？',
        '你最想摆脱的一个标签是什么？',
        '你曾经做过最疯狂的一件事？',
        '你人生中最想感谢的一个人是谁？为什么？',
        '如果明天就是世界末日，你今天会做什么？'
      ],
      questionIndex: 0,
      isSaving: false,
      isEdit: false
    }
  },

  onLoad() {
    this.loadUserProfile()
  },

  methods: {
	  // 头像选择回调
	  async onChooseAvatar(e) {
	    if (e.detail.avatarUrl) {
	      this.tempUserInfo.avatar = e.detail.avatarUrl
	      this.tempUserInfo.avatarBase64 = ''
	      this.showNicknameTip = true

	      try {
	        this.tempUserInfo.avatarBase64 = await this.imageToBase64(e.detail.avatarUrl)
	      } catch (error) {
	        console.warn('头像转 base64 失败，保存时会再次尝试:', error)
	      }
	    }
	  },
	  
	  // 昵称变更回调
	  onNicknameInput(e) {
	    this.tempUserInfo.nickname = e.detail.value
	  },

	  async onNicknameChange(e) {
	    const nickname = e.detail.value
	    if (nickname) {
	      this.tempUserInfo.nickname = nickname
	      this.showNicknameTip = false
	    }
	  },
	  
	  // 图片转 base64
	  imageToBase64(filePath) {
	    return new Promise((resolve, reject) => {
	      uni.getFileSystemManager().readFile({
	        filePath,
	        encoding: 'base64',
	        success: (res) => {
	          resolve(res.data)
	        },
	        fail: reject
	      })
	    })
	  },

	  normalizeImageForDisplay(value) {
	    return normalizeImageForDisplay(value)
	  },

	  compressImage(filePath) {
	    return new Promise((resolve, reject) => {
	      uni.compressImage({
	        src: filePath,
	        quality: 80,
	        success: (res) => resolve(res.tempFilePath),
	        fail: reject
	      })
	    })
	  },

	  async avatarToBase64(filePath) {
	    try {
	      return await this.imageToBase64(filePath)
	    } catch (error) {
	      const compressedPath = await this.compressImage(filePath)
	      return this.imageToBase64(compressedPath)
	    }
	  },

	  onFieldInput(field, e) {
	    this.formData[field] = e.detail.value
	  },
	  
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

    async loadUserProfile() {
      try {
		const userId = await this.userStore.getUserId()
        const res = await userApi.getUserProfile(userId)
        if (res.status === 10000 && res.data) {
		  const profileImage = res.data.image || ''
		  this.tempUserInfo.nickname = res.data.userName
		  this.tempUserInfo.avatarBase64 = toSubmittableImageBase64(profileImage)
          this.formData = {
            birthday: res.data.birthday || res.data.age || '', // 兼容旧数据
            company: res.data.company || '',
            position: res.data.position || '',
            school: res.data.school || '',
            introduction: res.data.introduction || '',
            personality: res.data.personality || '',
            question: res.data.question || '',
            answer: res.data.answer || ''
          }
          this.isEdit = true
          this.tempUserInfo.avatar = this.normalizeImageForDisplay(profileImage)
		  this.tempUserInfo.nickname = res.data.userName
          // 设置选择器的值
          this.birthdayDate = this.convertToDateString(res.data.birthday || res.data.age)
          const mbtiIndex = this.mbtiOptions.indexOf(res.data.personality)
          const questionIndex = this.questionOptions.indexOf(res.data.question)
          this.mbtiIndex = mbtiIndex >= 0 ? mbtiIndex : 0
          this.questionIndex = questionIndex >= 0 ? questionIndex : 0
        }
      } catch (error) {
        console.log('用户未创建个人信息')
      }
    },

    onBirthdayChange(e) {
      this.birthdayDate = e.detail.value
      // 转换为yyyyMMdd格式
      this.formData.birthday = e.detail.value.replace(/-/g, '')
    },

    // 将birthday字段转换为日期选择器需要的格式
    convertToDateString(birthday) {
      if (!birthday) return ''
      if (birthday.length === 4) {
        // 兼容旧的年份格式，默认为1月1日
        return `${birthday}-01-01`
      } else if (birthday.length === 8) {
        // yyyyMMdd格式转换为yyyy-MM-dd
        return `${birthday.slice(0, 4)}-${birthday.slice(4, 6)}-${birthday.slice(6, 8)}`
      }
      return birthday
    },

    // 格式化生日显示
    formatBirthdayDisplay() {
      if (!this.birthdayDate) return ''
      const date = new Date(this.birthdayDate)
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
    },

    onMbtiChange(e) {
      this.mbtiIndex = e.detail.value
      this.formData.personality = this.mbtiOptions[this.mbtiIndex]
    },

    onQuestionChange(e) {
      this.questionIndex = e.detail.value
      this.formData.question = this.questionOptions[this.questionIndex]
    },

    validateForm() {
		
		if (!this.hasSubmittableProfileImage()){
			  uni.showToast({
				title: this.tempUserInfo.avatar ? '请重新选择头像' : '请选择头像',
				icon: 'none'
			  })
			  return false
		}
	
		if (!this.tempUserInfo.nickname){
			  uni.showToast({
				title: `请填写用户名`,
				icon: 'none'
			  })
			  return false
		}
      const requiredFields = [
        { field: 'nickname', label: '昵称' },
        { field: 'birthday', label: '出生年月' },
        { field: 'company', label: '所在公司' },
        { field: 'school', label: '毕业院校' }
      ]

      for (let index = 0; index < requiredFields.length; index += 1) {
        const field = requiredFields[index].field
        const label = requiredFields[index].label
        if (field === 'nickname') {
          if (!this.tempUserInfo.nickname) {
            uni.showToast({
              title: `请填写${label}`,
              icon: 'none'
            })
            return false
          }
        } else {
          if (!this.formData[field]) {
            uni.showToast({
              title: `请填写${label}`,
              icon: 'none'
            })
            return false
          }
        }
      }



      return true
    },

    hasSubmittableProfileImage() {
      if (this.tempUserInfo.avatarBase64) return true
      if (!this.tempUserInfo.avatar) return false
      if (toSubmittableImageBase64(this.tempUserInfo.avatar)) return true
      if (isDataUrlImage(this.tempUserInfo.avatar)) return true
      return isLocalImagePath(this.tempUserInfo.avatar)
    },

    async resolveProfileImageForUpdate() {
      if (this.tempUserInfo.avatarBase64) {
        return this.tempUserInfo.avatarBase64
      }

      if (!this.tempUserInfo.avatar) {
        return ''
      }

      if (isDataUrlImage(this.tempUserInfo.avatar)) {
        this.tempUserInfo.avatarBase64 = toSubmittableImageBase64(this.tempUserInfo.avatar)
        return this.tempUserInfo.avatarBase64
      }

      if (isRemoteImageUrl(this.tempUserInfo.avatar) && !isLocalImagePath(this.tempUserInfo.avatar)) {
        throw new Error('请重新选择头像')
      }

      if (!isLocalImagePath(this.tempUserInfo.avatar)) {
        throw new Error('请重新选择头像')
      }

      this.tempUserInfo.avatarBase64 = await this.avatarToBase64(this.tempUserInfo.avatar)
      return this.tempUserInfo.avatarBase64
    },

    async saveProfile() {
      if (!this.validateForm()) return
      if (this.isSaving) return

      this.isSaving = true
      try {
        const userId = await this.userStore.getUserId()
        const userName = this.tempUserInfo && this.tempUserInfo.nickname
        const image = await this.resolveProfileImageForUpdate()
        
        // 构建完整的用户信息对象，包含所有字段
        const userProfileData = {
          userName: userName,
          image: image,
          birthday: this.formData.birthday,
          company: this.formData.company,
          position: this.formData.position,
          school: this.formData.school,
          introduction: this.formData.introduction,
          personality: this.formData.personality,
          question: this.formData.question,
          answer: this.formData.answer
        }
        
        console.log('提交的用户数据:', {
          ...userProfileData,
          image: userProfileData.image ? `[base64:${String(userProfileData.image).length}]` : ''
        })
        const res = await userApi.updateProfile(userProfileData, userId, userName, image)
        
        if (res.status === 10000) {
          this.userStore.setUserProfile({
            userId,
            ...userProfileData
          })
          uni.showToast({
            title: '保存成功',
            icon: 'success'
          })
          setTimeout(() => {
            // 使用 redirectTo 确保目标页面重新加载，或传递刷新参数
            uni.redirectTo({
              url: '/pages/profile/profileDetail?refresh=' + Date.now()
            });
          }, 500)
        } else {
          throw new Error(res.message || res.msg || '保存失败')
        }
      } catch (error) {
        uni.showToast({
          title: error.message || '保存失败',
          icon: 'none'
        })
      } finally {
        this.isSaving = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.profile-container {
  min-height: 100vh;
  background-color: #fff;
  padding-bottom: 50px;

  .nav-header {
    background-color: #000;
    color: #fff;
    padding: 44px 16px 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .left-btn {
      font-size: 16px;
    }

    .header-title {
      font-size: 18px;
      font-weight: 500;
    }

    .right-placeholder {
      width: 32px;
    }
  }
  
  .user-info {
    background-color: #fff;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 20px;
  
    .avatar-wrapper {
      width: 80px;
      height: 80px;
      padding: 0;
      margin: 0;
      background: none;
      border: 1px solid #e8e8e8;
      border-radius: 50%;
      overflow: hidden;
      flex-shrink: 0;
  
      &::after {
        border: none;
      }
  
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
      }
    }
  
    .nickname-input {
      flex: 1;
      font-size: 18px;
      color: #333;
      padding: 8px 0;
      border: none;
      background: none;
  
      &::placeholder {
        color: #999;
      }
  
      &.highlight {
        border-bottom: 1px solid #007AFF;
        
        &::placeholder {
          color: #007AFF;
        }
      }
    }
  }

  .form-section {
    padding: 20px 16px;

    .form-title {
      font-size: 16px;
      color: #333;
      margin-bottom: 8px;
    }

    .form-tip {
      font-size: 12px;
      color: #999;
      margin-bottom: 20px;
    }

    .form-item {
      margin-bottom: 20px;

      .label {
        display: block;
        font-size: 16px;
        color: #333;
        margin-bottom: 8px;

        .required {
          color: #ff4d4f;
          margin-left: 4px;
        }
      }

      .input, .picker-value {
        width: 100%;
        height: 44px;
        border: 1px solid #e8e8e8;
        border-radius: 4px;
        padding: 0 12px;
        font-size: 14px;
        background-color: #fff;
        box-sizing: border-box;
      }

      .picker-value {
        line-height: 44px;
        color: #333;
      }

      .textarea {
        width: 100%;
        height: 120px;
        border: 1px solid #e8e8e8;
        border-radius: 4px;
        padding: 12px;
        font-size: 14px;
        resize: none;
        box-sizing: border-box;
      }
    }
  }

  .save-btn {
    position: fixed;
    bottom: 34px;
    left: 50%;
    transform: translateX(-50%);
    width: 200px;
    height: 44px;
    line-height: 44px;
    background-color: #000;
    color: #fff;
    font-size: 16px;
    border-radius: 22px;
    text-align: center;

    &:disabled {
      opacity: 0.5;
      background-color: #ccc;
    }
  }
}
</style>

<style lang="scss" scoped>
.profile-container {
  min-height: 100vh;
  padding-bottom: 112px !important;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.95), transparent 34%),
    radial-gradient(circle at bottom right, rgba(231, 200, 171, 0.72), transparent 32%),
    linear-gradient(160deg, #f7f1eb 0%, #efe2d4 46%, #ead8c6 100%) !important;
  color: #2f241d;
  box-sizing: border-box;
}

.profile-container .nav-header {
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

.profile-container .left-btn {
  min-width: 54px;
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

.profile-container .header-title {
  flex: 1;
  color: #2f241d !important;
  font-size: 17px !important;
  font-weight: 900 !important;
  line-height: 1.35;
  text-align: center;
}

.profile-container .right-placeholder {
  width: 54px !important;
}

.profile-container .user-info,
.profile-container .form-section {
  margin: 18px 18px 0 !important;
  border: 1px solid rgba(82, 49, 31, 0.12);
  border-radius: 22px;
  background: #fffaf5 !important;
  box-shadow: 0 10px 24px rgba(98, 63, 36, 0.06);
}

.profile-container .user-info {
  padding: 18px !important;
}

.profile-container .avatar-wrapper {
  width: 72px !important;
  height: 72px !important;
  border: 0 !important;
  border-radius: 22px !important;
  background: #f4e7dc !important;
  box-shadow: 0 10px 22px rgba(111, 61, 29, 0.12);
}

.profile-container .avatar-wrapper::after,
.profile-container .save-btn::after {
  border: none;
}

.profile-container .avatar-placeholder {
  background: #f7eadf;
  color: #8a766a !important;
  font-size: 13px !important;
  font-weight: 800;
}

.profile-container .nickname-input {
  min-width: 0;
  height: 44px;
  padding: 0 !important;
  color: #2f241d !important;
  font-size: 20px !important;
  font-weight: 900;
  line-height: 44px;
}

.profile-container .nickname-input.highlight {
  border-bottom: 1px solid #9c5b2e !important;
}

.profile-container .tip-text {
  margin: 8px 18px 0;
  padding: 0 2px;
  color: #9c5b2e !important;
  font-size: 13px;
  font-weight: 800;
}

.profile-container .form-section {
  padding: 18px !important;
}

.profile-container .form-title {
  margin-bottom: 4px !important;
  color: #2f241d !important;
  font-size: 17px !important;
  font-weight: 900;
  line-height: 1.35;
}

.profile-container .form-tip {
  margin-bottom: 18px !important;
  color: #8a766a !important;
  font-size: 13px !important;
  line-height: 1.45;
}

.profile-container .form-item {
  margin-bottom: 18px !important;
}

.profile-container .form-item:last-child {
  margin-bottom: 0 !important;
}

.profile-container .label {
  display: block;
  margin-bottom: 8px !important;
  color: #2f241d !important;
  font-size: 14px !important;
  font-weight: 900;
  line-height: 1.4;
}

.profile-container .required {
  color: #9c5b2e !important;
}

.profile-container .input,
.profile-container .picker-value,
.profile-container .textarea {
  width: 100%;
  border: 1px solid rgba(82, 49, 31, 0.12) !important;
  border-radius: 18px !important;
  background: #ffffff !important;
  color: #2f241d !important;
  font-size: 14px !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.profile-container .input,
.profile-container .picker-value {
  height: 48px !important;
  line-height: 48px !important;
  padding: 0 14px !important;
}

.profile-container .textarea {
  min-height: 132px !important;
  padding: 12px 14px !important;
  line-height: 1.6;
}

.profile-container .save-btn {
  position: fixed;
  right: 18px;
  bottom: 34px;
  left: 18px !important;
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
}

.profile-container .save-btn-disabled {
  border: 1px solid rgba(82, 49, 31, 0.1) !important;
  background: #f3eee8 !important;
  box-shadow: none;
  color: #a89a91 !important;
  opacity: 1 !important;
}
</style>
