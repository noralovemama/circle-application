<template>
  <view class="login-container">
    <view class="brand-section">
      <text class="brand-title">小群友</text>
    </view>

    <!-- 登录表单 -->
    <view class="login-form">
      <!-- 手机号输入 -->
      <view class="input-group">
        <text class="country-code">+86</text>
        <input 
          class="phone-input" 
          type="number" 
          maxlength="11"
          placeholder="输入手机号" 
          placeholder-class="input-placeholder"
          v-model="phone"
          @input="validatePhone"
        />
      </view>

      <!-- 验证码输入 -->
      <view class="input-group">
        <input 
          class="code-input" 
          type="number" 
          maxlength="6"
          placeholder="输入验证码" 
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
        {{ isLoggingIn ? '登录中...' : '登录' }}
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

  onLoad() {
    console.log('[Login] build: network-probe-v4')
    this.probeLoginNetwork()
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
    validatePhone() {
      // 验证手机号格式
      const phoneReg = /^1[3-9]\d{9}$/
      this.isPhoneValid = phoneReg.test(this.phone)
    },

    async getCode() {
      if (this.counting || !this.isPhoneValid || this.isRequesting) return
      
      this.isRequesting = true
      
      try {
        const res = await userApi.sendVerificationCode(this.phone)
        if (Number(res.status ?? res.code) === 10000) {
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
            title: '验证码已发送',
            icon: 'success'
          })
        } else {
          throw new Error(res.message || res.msg || '发送失败')
        }
      } catch (error) {
        console.error('发送验证码失败:', error)
        uni.showToast({
          title: this.getErrorMessage(error, '发送失败'),
          icon: 'none'
        })
      } finally {
        this.isRequesting = false
      }
    },

    probeLoginNetwork() {
      const payload = {
        phoneNumber: '18814842880',
        validateCode: '123456',
        code: 'wx547471e427601166'
      }
      ;['https://fry-river-fish.com/token/login', 'https://www.fry-river-fish.com/token/login'].forEach((url) => {
        const start = Date.now()
        uni.request({
          url,
          method: 'POST',
          data: payload,
          timeout: 10000,
          dataType: 'json',
          header: {
            'Content-Type': 'application/json'
          },
          success: (response) => {
            console.log('[NetworkProbe] success', {
              url,
              duration: Date.now() - start,
              statusCode: response.statusCode,
              data: response.data
            })
          },
          fail: (error) => {
            console.error('[NetworkProbe] fail', {
              url,
              duration: Date.now() - start,
              errMsg: error.errMsg,
              errno: error.errno
            })
          },
          complete: (result) => {
            console.log('[NetworkProbe] complete', {
              url,
              duration: Date.now() - start,
              errMsg: result.errMsg,
              statusCode: result.statusCode
            })
          }
        })
      })
    },

    async handleLogin() {
      if (!this.phone || !this.validateCode || this.isLoggingIn) return

      this.isLoggingIn = true
      try {
        const { code } = await uni.login()
        if (!code) {
          throw new Error('获取登录凭证失败')
        }

        console.log('[Login] wx.login code:', code)
        console.log('[Login] token/login payload:', {
          phoneNumber: this.phone,
          validateCode: this.validateCode,
          code
        })

        const res = await userApi.loginWithCode(this.phone, this.validateCode, code)
        if (res.status === 10000) {
          await this.userStore.setTokenInfo({
            openId: res.data.openId,
            expireAt: res.data.expireAt,
            userId: res.data.userId
          })

          try {
            await this.userStore.getUserDetail()
          } catch (error) {
            console.log('获取用户详情失败，可能是新用户:', error)
          }

          uni.showToast({
            title: '登录成功',
            icon: 'success'
          })

          setTimeout(() => {
            uni.switchTab({
              url: '/pages/circle/circle'
            })
          }, 1500)
        } else {
          throw new Error(res.message || '登录失败')
        }
      } catch (error) {
        uni.showToast({
          title: error.message || '登录失败',
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
    radial-gradient(circle at bottom right, rgba(231, 200, 171, 0.72), transparent 32%),
    linear-gradient(160deg, #f7f1eb 0%, #efe2d4 46%, #ead8c6 100%);
  color: #2f241d;

  .brand-section {
    padding-top: 36rpx;
    margin-bottom: 64rpx;
    text-align: center;
  }



  .brand-title {
    display: block;
    font-size: 88rpx;
    font-weight: 900;
    line-height: 1.08;
    letter-spacing: -4rpx;
    color: #2f241d;
  }

  .login-form {
    padding: 34rpx 30rpx 40rpx;
    border: 1rpx solid rgba(82, 49, 31, 0.1);
    border-radius: 44rpx;
    background: rgba(255, 250, 245, 0.9);
    box-shadow: 0 24rpx 56rpx rgba(80, 43, 18, 0.12);
    backdrop-filter: blur(18px);

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
        color: #6f3d1d;
        margin-right: 20rpx;
      }

      .phone-input,
      .code-input {
        flex: 1;
        height: 100%;
        font-size: 30rpx;
        color: #2f241d;
      }

      .get-code {
        font-size: 26rpx;
        font-weight: 800;
        color: #a89a91;
        padding-left: 24rpx;

        &.disabled {
          color: #b7aaa0;
        }

        &.active {
          color: #9c5b2e;
        }

        &.requesting {
          opacity: 0.5;
        }
      }
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
        background: linear-gradient(135deg, #9c5b2e, #6f3d1d);
        color: #ffffff;
        box-shadow: 0 18rpx 34rpx rgba(111, 61, 29, 0.22);
      }

      &::after {
        border: none;
      }
    }
  }
}
</style>
