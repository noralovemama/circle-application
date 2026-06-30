<template>
  <view class="login-container">
    <view class="brand-section">
      <text class="brand-eyebrow">小群友</text>
      <text class="brand-title">小群友</text>
      <text class="brand-copy">30 秒登录，先看附近在聊什么，再决定要不要加入一场想去的小局。</text>
      <view class="value-points">
        <text class="value-pill">固定 6 人</text>
        <text class="value-pill">先留言再见面</text>
        <text class="value-pill">聊得来再约朋友</text>
      </view>
    </view>

    <view class="login-form">
      <view class="form-head">
        <text class="form-title">登录继续</text>
        <text class="form-subtitle">固定 6 人的小局，会更依赖真实身份和稳定联系。</text>
      </view>

      <view class="notice-bar">
        <text class="notice-text">仅用于登录验证和活动联系，不会公开展示你的手机号。</text>
      </view>

      <view class="login-steps">
        <view class="step-item">
          <text class="step-index">1</text>
          <view class="step-copy">
            <text class="step-title">先登录</text>
            <text class="step-desc">30 秒完成，进去先看看附近都在聊什么。</text>
          </view>
        </view>
        <view class="step-item">
          <text class="step-index">2</text>
          <view class="step-copy">
            <text class="step-title">挑一局</text>
            <text class="step-desc">重点看主题、时间和发起人，合适再加入。</text>
          </view>
        </view>
        <view class="step-item">
          <text class="step-index">3</text>
          <view class="step-copy">
            <text class="step-title">先打个招呼</text>
            <text class="step-desc">加入后可以留言确认时间、问细节，也更容易认识人。</text>
          </view>
        </view>
      </view>

      <view class="input-group">
        <text class="country-code">+86</text>
        <input 
          class="phone-input" 
          type="number" 
          maxlength="11"
          placeholder="输入常用手机号" 
          placeholder-class="input-placeholder"
          v-model="phone"
          @input="validatePhone"
        />
      </view>

      <view class="input-group">
        <input 
          class="code-input" 
          type="number" 
          maxlength="6"
          placeholder="输入短信验证码" 
          placeholder-class="input-placeholder"
          v-model="validateCode"
        />
        <text 
          class="get-code" 
          :class="{ 
            disabled: !isPhoneValid || counting,
            active: isPhoneValid && !counting,
            requesting: isRequesting 
          }" 
          @click="getCode"
        >
          {{ counting ? `${countdown}s后重试` : '获取验证码' }}
        </text>
      </view>

      <!-- 登录按钮 -->
      <button 
        class="login-btn" 
        :class="{ active: phone && validateCode }"
        @click="handleLogin"
      >
        {{ isLoggingIn ? '登录中...' : '登录去看看' }}
      </button>

    </view>
  </view>
</template>

<script>
import { useUserStore } from '@/store/user'
import { userApi } from '@/request/api'

export default {
  setup() {
    const userStore = useUserStore()
    return {
      userStore
    }
  },

  data() {
    return {
      phone: '',
      validateCode: '',
      counting: false,
      countdown: 60,
      isPhoneValid: false,
      isRequesting: false,
      isLoggingIn: false
    }
  },
  methods: {
    validatePhone(e) {
      if (e && e.detail) {
        this.phone = e.detail.value
      }
      // 验证手机号格式
      const phoneReg = /^1[3-9]\d{9}$/
      this.isPhoneValid = phoneReg.test(this.phone)
    },

    async getCode() {
      if (this.counting || !this.isPhoneValid || this.isRequesting) return
      
      this.isRequesting = true
      
      try {
        const res = await userApi.sendVerificationCode(this.phone)
        const statusCode = res.status !== undefined && res.status !== null ? res.status : res.code
        if (Number(statusCode) === 10000) {
          // 开始倒计时，不自动填充验证码
          this.counting = true
          this.countdown = 60
          const timer = setInterval(() => {
            if (this.countdown > 0) {
              this.countdown--
            } else {
              this.counting = false
              clearInterval(timer)
            }
          }, 1000)

          uni.showToast({
            title: '验证码已经发出',
            icon: 'success'
          })
        } else {
          throw new Error(res.message || res.msg || '验证码没有发出去')
        }
      } catch (error) {
        console.error('发送验证码失败:', error)
        uni.showToast({
          title: this.getErrorMessage(error, '验证码没有发出去'),
          icon: 'none'
        })
      } finally {
        this.isRequesting = false
      }
    },

    async handleLogin() {
      if (!this.phone || !this.validateCode || this.isLoggingIn) return

      this.isLoggingIn = true
      try {
        const loginResult = await uni.login()
        const loginData = Array.isArray(loginResult) ? loginResult[1] : loginResult
        const code = loginData && loginData.code

        if (!code) {
          throw new Error('登录校验没有拿到，请再试一次')
        }

        console.log('[Login] wx.login code:', code)
        console.log('[Login] token/login payload:', {
          phoneNumber: this.phone,
          validateCode: this.validateCode,
          code
        })

        const res = await userApi.loginWithCode(this.phone, this.validateCode, code)
        if (res.status === 10000) {
          const tokenSaved = await this.userStore.setTokenInfo(res.data || {})
          if (!tokenSaved) {
            throw new Error('登录信息不完整，请稍后再试')
          }

          try {
            await this.userStore.getUserDetail()
          } catch (error) {
            console.log('获取用户详情失败，可能是新用户:', error)
          }

          uni.showToast({
            title: '登录成功，马上带你进去',
            icon: 'success'
          })

          setTimeout(() => {
            uni.switchTab({
              url: '/pages/circle/circle'
            })
          }, 1500)
        } else {
          throw new Error(res.message || '这次登录没有成功')
        }
      } catch (error) {
        uni.showToast({
          title: error.message || '这次登录没有成功',
          icon: 'none'
        })
      } finally {
        this.isLoggingIn = false
      }
    },

    getRawErrorMessage(error, fallback) {
      if (!error) return fallback
      if (typeof error === 'string') return error
      return error.message || error.errMsg || error.msg || fallback
    },

    getErrorMessage(error, fallback) {
      return this.getRawErrorMessage(error, fallback)
    },

  }
}
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  padding: calc(var(--status-bar-height) + 72rpx) 40rpx 40rpx;
  box-sizing: border-box;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.95), transparent 34%),
    radial-gradient(circle at bottom right, rgba(216, 194, 174, 0.68), transparent 34%),
    linear-gradient(160deg, #f7f3ee 0%, #efe4d8 48%, #e6d7c8 100%);
  color: #30261f;

  .brand-section {
    padding-top: 36rpx;
    margin-bottom: 64rpx;
    padding-left: 8rpx;
  }

  .brand-eyebrow {
    display: inline-flex;
    align-items: center;
    padding: 10rpx 18rpx;
    border-radius: 999rpx;
    background: rgba(255, 255, 255, 0.5);
    color: #7b5f48;
    font-size: 22rpx;
    font-weight: 800;
    letter-spacing: 1rpx;
  }

  .brand-title {
    display: block;
    margin-top: 24rpx;
    font-size: 88rpx;
    font-weight: 900;
    line-height: 1.08;
    letter-spacing: -4rpx;
    color: #30261f;
  }

  .brand-copy {
    display: block;
    max-width: 560rpx;
    margin-top: 20rpx;
    color: #7d6a5c;
    font-size: 28rpx;
    line-height: 1.6;
  }

  .value-points {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
    margin-top: 28rpx;
  }

  .value-pill {
    min-height: 52rpx;
    padding: 0 20rpx;
    border-radius: 999rpx;
    background: rgba(255, 250, 245, 0.74);
    color: #7b5f48;
    font-size: 22rpx;
    font-weight: 800;
    line-height: 52rpx;
    border: 1rpx solid rgba(123, 95, 73, 0.08);
  }

  .login-form {
    padding: 34rpx 30rpx 40rpx;
    border: 1rpx solid rgba(82, 49, 31, 0.1);
    border-radius: 44rpx;
    background: rgba(255, 250, 245, 0.9);
    box-shadow: 0 24rpx 56rpx rgba(80, 43, 18, 0.12);
    backdrop-filter: blur(18px);

    .form-head {
      margin-bottom: 22rpx;
    }

    .form-title {
      display: block;
      color: #30261f;
      font-size: 38rpx;
      font-weight: 900;
      line-height: 1.25;
    }

    .form-subtitle {
      display: block;
      margin-top: 10rpx;
      color: #7d6a5c;
      font-size: 24rpx;
      line-height: 1.55;
    }

    .input-group {
      display: flex;
      align-items: center;
      height: 104rpx;
      padding: 0 26rpx;
      margin-bottom: 22rpx;
      border: 1rpx solid rgba(82, 49, 31, 0.1);
      border-radius: 28rpx;
      background: #fffaf5;
      box-sizing: border-box;

      .country-code {
        font-size: 30rpx;
        font-weight: 800;
        color: #7b5f48;
        margin-right: 20rpx;
      }

      .phone-input,
      .code-input {
        flex: 1;
        height: 100%;
        font-size: 30rpx;
        color: #30261f;
      }

      .get-code {
        font-size: 26rpx;
        font-weight: 800;
        color: #a89a91;
        padding-left: 24rpx;
        transition: color 160ms ease, opacity 160ms ease;

        &.disabled {
          color: #b7aaa0;
        }

        &.active {
          color: #8c664c;
        }

        &.requesting {
          opacity: 0.5;
        }
      }
    }

    .notice-bar {
      margin-bottom: 20rpx;
      padding: 18rpx 20rpx;
      border-radius: 24rpx;
      background: rgba(140, 102, 76, 0.08);
    }

    .notice-text {
      color: #7b5f48;
      font-size: 24rpx;
      line-height: 1.5;
    }

    .login-steps {
      margin-bottom: 24rpx;
      padding: 10rpx 0 2rpx;
    }

    .step-item {
      display: flex;
      align-items: flex-start;
      gap: 18rpx;
      padding: 16rpx 0;
    }

    .step-index {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40rpx;
      height: 40rpx;
      border-radius: 999rpx;
      background: #f1e4d8;
      color: #7b5f48;
      font-size: 22rpx;
      font-weight: 900;
      line-height: 40rpx;
      flex-shrink: 0;
    }

    .step-copy {
      flex: 1;
      min-width: 0;
    }

    .step-title {
      display: block;
      color: #30261f;
      font-size: 26rpx;
      font-weight: 900;
      line-height: 38rpx;
    }

    .step-desc {
      display: block;
      margin-top: 6rpx;
      color: #7d6a5c;
      font-size: 23rpx;
      line-height: 34rpx;
    }

    .input-placeholder {
      color: #a89a91;
      font-size: 30rpx;
    }

    .login-btn {
      width: 100%;
      height: 96rpx;
      line-height: 96rpx;
      text-align: center;
      margin: 42rpx 0 0;
      border: 0;
      border-radius: 28rpx;
      background: #e8d8cb;
      color: rgba(111, 61, 29, 0.58);
      font-size: 32rpx;
      font-weight: 900;

      &.active {
        background: linear-gradient(135deg, #8c664c 0%, #72513b 100%);
        color: #ffffff;
        box-shadow: 0 18rpx 34rpx rgba(94, 70, 52, 0.22);
      }

      &:not(.active) {
        box-shadow: none;
      }

      &::after {
        border: none;
      }
    }
  }
}
</style>
