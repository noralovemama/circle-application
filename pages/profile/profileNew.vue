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
	    @click="handleAvatarTap"
	  >
	    <image 
	      v-if="tempUserInfo.avatar"
	      :src="tempUserInfo.avatar"
	      class="avatar-image"
	      mode="aspectFill"
	    />
	    <view v-else class="avatar-placeholder">
	      <text>{{ nicknameInitial }}</text>
	    </view>
	  </button>

	  <view class="profile-copy">
	    <text class="profile-title">{{ profileTitle }}</text>
	    <text class="profile-caption">{{ avatarHelperText }}</text>
	  </view>
	</view>
	
	<!-- 提示信息 -->
	<view v-if="showNicknameTip" class="tip-text">
	  昵称会展示给其他人看，建议填一个容易被记住的名字。
	</view>

    <!-- 表单区域 -->
    <view class="form-stack">
      <view class="section-card">
        <view class="section-card-head">
          <text class="section-card-title">基础信息</text>
          <text class="section-card-desc">先把别人第一眼会看到的内容补完整。</text>
        </view>

        <view class="form-item">
          <text class="label">昵称<text class="required">*</text></text>
          <input 
            class="input" 
            v-model="tempUserInfo.nickname" 
            @input="onNicknameInput"
            @change="onNicknameChange"
            placeholder="怎么称呼你？"
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
      </view>

      <view class="section-card">
        <view class="section-card-head">
          <text class="section-card-title">职业信息</text>
          <text class="section-card-desc">让别人更快判断你们聊不聊得来。</text>
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
      </view>

      <view class="section-card">
        <view class="section-card-head">
          <text class="section-card-title">让别人先认识你</text>
          <text class="section-card-desc">不需要写很满，但最好让人看完有印象。</text>
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

  computed: {
	 nicknameInitial() {
		const nickname = String(this.tempUserInfo.nickname || '').trim()
		return nickname ? nickname.slice(0, 1) : '我'
	 },
	 profileTitle() {
		const nickname = String(this.tempUserInfo.nickname || '').trim()
		return nickname || '设置你的昵称'
	 },
	 avatarHelperText() {
		if (this.tempUserInfo.avatar) {
			return '点一下可以更换头像'
		}
		return '上传一张清晰头像，让大家更容易认出你'
	 }
  },

  onLoad() {
    this.loadUserProfile()
  },

  methods: {
	  handleAvatarTap() {
		// #ifndef MP-WEIXIN
		this.pickAvatarImage()
		// #endif
	  },

	  // 头像选择回调
	  async onChooseAvatar(e) {
	    if (e.detail.avatarUrl) {
	      await this.applySelectedAvatar(e.detail.avatarUrl)
	      return
	    }

		this.pickAvatarImage()
	  },

	  async pickAvatarImage() {
		try {
			const chooseResult = await uni.chooseImage({
				count: 1,
				crop: {
					width: 600,
					height: 600
				},
				sizeType: ['compressed'],
				sourceType: ['album', 'camera']
			})
			const result = Array.isArray(chooseResult) ? chooseResult[1] : chooseResult
			const filePath = result && result.tempFilePaths && result.tempFilePaths[0]
			if (!filePath) return
			await this.applySelectedAvatar(filePath)
		} catch (error) {
			if (error && String(error.errMsg || error.message || '').indexOf('cancel') !== -1) {
				return
			}
			uni.showToast({
				title: '选择头像失败',
				icon: 'none'
			})
		}
	  },

	  async applySelectedAvatar(filePath) {
		this.tempUserInfo.avatar = filePath
		this.tempUserInfo.avatarBase64 = ''

		try {
			this.tempUserInfo.avatarBase64 = await this.avatarToBase64(filePath)
		} catch (error) {
			console.warn('头像转 base64 失败，保存时会再次尝试:', error)
		}
	  },
	  
	  // 昵称变更回调
	  onNicknameInput(e) {
	    this.tempUserInfo.nickname = (e.detail.value || '').trimStart()
		this.showNicknameTip = !String(this.tempUserInfo.nickname || '').trim()
	  },

	  async onNicknameChange(e) {
	    const nickname = String((e.detail && e.detail.value) || '').trim()
	    this.tempUserInfo.nickname = nickname
	    this.showNicknameTip = !nickname
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
			  this.tempUserInfo.nickname = res.data.userName || ''
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
			  this.tempUserInfo.nickname = res.data.userName || ''
			  this.showNicknameTip = !String(this.tempUserInfo.nickname || '').trim()
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
	
			if (!String(this.tempUserInfo.nickname || '').trim()){
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
	        const userName = String((this.tempUserInfo && this.tempUserInfo.nickname) || '').trim()
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
  padding-bottom: 112px !important;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.95), transparent 34%),
    radial-gradient(circle at bottom right, rgba(216, 194, 174, 0.68), transparent 34%),
    linear-gradient(160deg, #f7f3ee 0%, #efe4d8 48%, #e6d7c8 100%) !important;
  color: #30261f;
  box-sizing: border-box;
}

.profile-container .nav-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: calc(var(--status-bar-height) + 10px) 16px 12px !important;
  border-bottom: 1px solid rgba(82, 49, 31, 0.1);
  background: rgba(255, 250, 245, 0.88) !important;
  color: #30261f !important;
  backdrop-filter: blur(18px);
}

.profile-container .left-btn {
  min-width: 52px;
  height: 30px;
  line-height: 30px;
  padding: 0 10px;
  border: 1px solid rgba(111, 61, 29, 0.1);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 4px 12px rgba(111, 61, 29, 0.05);
  color: #7b5f48;
  font-size: 12px !important;
  font-weight: 700;
  text-align: center;
}

.profile-container .header-title {
  flex: 1;
  color: #30261f !important;
  font-size: 17px !important;
  font-weight: 800 !important;
  line-height: 30px;
  text-align: center;
  letter-spacing: -0.2px;
}

.profile-container .right-placeholder {
  width: 52px !important;
}

.profile-container .user-info,
.profile-container .section-card {
  margin: 20px 20px 0 !important;
  border: 1px solid rgba(82, 49, 31, 0.12);
  border-radius: 22px;
  background: #fffaf5 !important;
  box-shadow: 0 10px 24px rgba(103, 77, 58, 0.06);
}

.profile-container .user-info {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px !important;
}

.profile-container .avatar-wrapper {
  width: 76px !important;
  height: 76px !important;
  border: 0 !important;
  border-radius: 24px !important;
  background: #efe3d8 !important;
  box-shadow: 0 10px 22px rgba(111, 84, 63, 0.12);
  overflow: hidden !important;
  padding: 0 !important;
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
}

.profile-container .avatar-wrapper::after,
.profile-container .save-btn::after {
  border: none;
}

.profile-container .avatar-image,
.profile-container .avatar-placeholder {
  width: 100% !important;
  height: 100% !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-container .avatar-placeholder {
  background: #f1e4d8;
  color: #7d6a5c !important;
  font-size: 28px !important;
  font-weight: 900;
}

.profile-container .profile-copy {
  flex: 1;
  min-width: 0;
}

.profile-container .profile-title {
  display: block;
  color: #30261f !important;
  font-size: 24px !important;
  font-weight: 900;
  line-height: 32px;
}

.profile-container .profile-caption {
  display: block;
  margin-top: 8px;
  color: #7d6a5c !important;
  font-size: 13px !important;
  line-height: 20px;
}

.profile-container .tip-text {
  margin: 10px 20px 0;
  padding: 0 2px;
  color: #8c664c !important;
  font-size: 13px;
  font-weight: 800;
  line-height: 20px;
}

.profile-container .form-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.profile-container .section-card {
  padding: 20px !important;
  overflow: hidden;
}

.profile-container .section-card-head {
  margin-bottom: 18px;
}

.profile-container .section-card-title {
  display: block;
  color: #30261f !important;
  font-size: 18px !important;
  font-weight: 900;
  line-height: 26px;
}

.profile-container .section-card-desc {
  display: block;
  margin-top: 6px;
  color: #7d6a5c !important;
  font-size: 13px !important;
  line-height: 20px;
}

.profile-container .form-item {
  width: 100%;
  min-width: 0;
  margin-bottom: 20px !important;
}

.profile-container .form-item:last-child {
  margin-bottom: 0 !important;
}

.profile-container .label {
  display: block;
  margin-bottom: 10px !important;
  color: #30261f !important;
  font-size: 15px !important;
  font-weight: 900;
  line-height: 22px;
}

.profile-container .required {
  color: #8c664c !important;
}

.profile-container .input,
.profile-container .picker-value,
.profile-container .textarea {
  display: block;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  border: 1px solid rgba(82, 49, 31, 0.12) !important;
  border-radius: 18px !important;
  background: #ffffff !important;
  color: #30261f !important;
  font-size: 14px !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
  box-sizing: border-box;
}

.profile-container .input,
.profile-container .picker-value {
  height: 48px !important;
  line-height: 48px !important;
  padding: 0 14px !important;
  font-size: 15px !important;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile-container .textarea {
  min-height: 136px !important;
  padding: 14px !important;
  font-size: 15px !important;
  font-weight: 500;
  line-height: 24px;
  overflow: hidden;
  resize: none;
}

.profile-container .save-btn {
  position: fixed;
  right: 20px;
  bottom: 34px;
  left: 20px !important;
  width: auto !important;
  height: 48px !important;
  line-height: 48px !important;
  transform: none !important;
  border: 0 !important;
  border-radius: 18px !important;
  background: linear-gradient(135deg, #8c664c 0%, #72513b 100%) !important;
  box-shadow: 0 14px 26px rgba(94, 70, 52, 0.18);
  color: #ffffff !important;
  font-size: 15px !important;
  font-weight: 900;
}

.profile-container .save-btn-disabled {
  border: 1px solid rgba(82, 49, 31, 0.1) !important;
  background: #efe7df !important;
  box-shadow: none;
  color: #ad9d90 !important;
  opacity: 1 !important;
}
</style>
