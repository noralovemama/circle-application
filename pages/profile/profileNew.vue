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
          placeholder="请输入公司名称"
        />
      </view>

      <view class="form-item">
        <text class="label">毕业院校<text class="required">*</text></text>
        <input 
          class="input" 
          v-model="formData.school" 
          placeholder="请输入毕业院校"
        />
      </view>

      <view class="form-item">
        <text class="label">职位</text>
        <input 
          class="input" 
          v-model="formData.position" 
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
          placeholder="回答你选择的问题"
        />
      </view>
    </view>

    <!-- 保存按钮 -->
    <button 
      class="save-btn" 
      @click="saveProfile" 
      :disabled="isSaving"
    >{{ isSaving ? '保存中...' : '保存' }}</button>
  </view>
</template>

<script>
import userApi from '@/request/api/user'

// 确保页面被正确引用
console.log('profileNew页面已加载')

export default {
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
	      try {
	        uni.showLoading({
	          title: '处理中...'
	        })
	        
	        // 更新临时头像显示
	        this.tempUserInfo.avatar = e.detail.avatarUrl
	        // 显示昵称提示
	        this.showNicknameTip = true
	        
	        // 转换为 base64
	        const base64 = await this.imageToBase64(e.detail.avatarUrl)
	        // 保存 base64 格式
	        this.tempUserInfo.avatarBase64 = base64
	  
	        uni.hideLoading()
	      } catch (error) {
	        uni.hideLoading()
	        console.error('头像处理失败:', error)
	        uni.showToast({
	          title: '头像设置失败',
	          icon: 'none'
	        })
	      }
	    }
	  },
	  
	  // 昵称变更回调
	  async onNicknameChange(e) {
	    const nickname = e.detail.value
	    if (nickname) {
	      this.tempUserInfo.nickname = nickname
	      this.showNicknameTip = false
	  
	      try {
	        uni.showLoading({
	          title: '更新中...'
	        })
	  
	        // 如果有头像和昵称，就更新用户信息
	        if (this.tempUserInfo.avatarBase64 && this.tempUserInfo.nickname) {
	          await this.$store.dispatch('user/updateUserInfo', {
	            ...this.userInfo,
	            avatar: this.tempUserInfo.avatarBase64,
	            nickname: this.tempUserInfo.nickname
	          })
	          
	          uni.hideLoading()
	          uni.showToast({
	            title: '更新成功',
	            icon: 'success'
	          })
	        } else {
	          uni.hideLoading()
	        }
	      } catch (error) {
	        uni.hideLoading()
	        console.error('更新失败:', error)
	        uni.showToast({
	          title: '更新失败',
	          icon: 'none'
	        })
	      }
	    }
	  },
	  
	  // 图片转 base64
	  imageToBase64(filePath) {
	    return new Promise((resolve, reject) => {
	      uni.getFileSystemManager().readFile({
	        filePath,
	        encoding: 'base64',
	        success: (res) => {
	          resolve(`data:image/png;base64,${res.data}`)
	        },
	        fail: reject
	      })
	    })
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
		const userId = await uni.getStorageSync('token')
        const res = await userApi.getUserProfile(userId)
        if (res.status === 10000 && res.data) {
		  this.tempUserInfo.nickname = res.data.userName
		  this.tempUserInfo.avatarBase64 = res.data.image
          this.formData = {
            birthday: res.data.birthday || res.data.age, // 兼容旧数据
            company: res.data.company,
            position: res.data.position,
            school: res.data.school,
            introduction: res.data.introduction,
            personality: res.data.personality,
            question: res.data.question,
            answer: res.data.answer
          }
          this.isEdit = true
          this.tempUserInfo.avatar = res.data.image
		  this.tempUserInfo.nickname = res.data.userName
          // 设置选择器的值
          this.birthdayDate = this.convertToDateString(res.data.birthday || res.data.age)
          this.mbtiIndex = this.mbtiOptions.indexOf(res.data.personality)
          this.questionIndex = this.questionOptions.indexOf(res.data.question)
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
		
		if (!this.tempUserInfo.avatarBase64){
			  uni.showToast({
				title: `请选择头像`,
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
      const requiredFields = {
        nickname: '昵称',
        birthday: '出生年月',
        company: '所在公司',
        school: '毕业院校'
      }

      for (const [field, label] of Object.entries(requiredFields)) {
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

    async saveProfile() {
      if (!this.validateForm()) return
      if (this.isSaving) return

      this.isSaving = true
      try {
        const userId = await uni.getStorageSync('token')
        const userName = this.tempUserInfo?.nickname
        const image = this.tempUserInfo?.avatarBase64
        
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
        
        console.log('提交的用户数据:', userProfileData)
        const res = await userApi.updateProfile(userProfileData, userId, userName, image)
        
        if (res.status === 10000) {
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