<template>
  <view class="login-container">
    <!-- Logo区域 -->
    <view class="logo-section">
      <view class="logo-text">圈子</view>
      <text class="slogan">你的生活指南</text>
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
        登录
      </button>

      <!-- 用户协议 -->
      <view class="agreement">
        <checkbox-group @change="handleAgreementChange">
          <label class="agreement-label">
            <checkbox class="checkbox" :checked="agreed" color="#fe2c55"/>
            <text class="agreement-text">
              我已阅读并同意
              <text class="link">《圈子用户协议》</text>
              <text class="link">《圈子隐私政策》</text>
              <text class="link">《圈子青少年个人信息保护规则》</text>
            </text>
          </label>
        </checkbox-group>
      </view>
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
      agreed: false,
      counting: false,
      countdown: 60,
      isPhoneValid: false,
      isRequesting: false
    }
  },
  methods: {
    validatePhone() {
      // 验证手机号格式
      const phoneReg = /^1[3-9]\d{9}$/
      this.isPhoneValid = phoneReg.test(this.phone)
    },

    async getCode() {
      // 检查是否勾选了协议
      if (!this.agreed) {
        uni.showToast({
          title: '请先勾选用户协议',
          icon: 'none'
        })
        return
      }
      
      if (this.counting || !this.isPhoneValid || this.isRequesting) return
      
      this.isRequesting = true
      
      try {
        const res = await userApi.sendVerificationCode(this.phone)
        if (res.status === 10000) {
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
          throw new Error(res.message)
        }
      } catch (error) {
        uni.showToast({
          title: error.message || '发送失败',
          icon: 'none'
        })
      } finally {
        this.isRequesting = false
      }
    },

    async handleLogin() {
      if (!this.phone || !this.validateCode || !this.agreed) return

      try {
	   const { code } = await uni.login()
	   if (!code) {
		 throw new Error('获取登录凭证失败')
	   }
        const res = await userApi.loginWithCode(this.phone, this.validateCode, code)
        if (res.status === 10000) {
          // 保存用户信息
          this.userStore.setTokenInfo({
			  openId: res.data.openId, 
			  expireAt:res.data.expireAt
		  })

          // 获取用户详情
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
          throw new Error(res.message)
        }
      } catch (error) {
        uni.showToast({
          title: error.message || '登录失败',
          icon: 'none'
        })
      }
    },

    handleAgreementChange(e) {
      this.agreed = e.detail.value.length > 0
    }
  }
}
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  background-color: #fff;
  padding: 0 40rpx;

  .logo-section {
    padding-top: 120rpx;
    text-align: center;
    margin-bottom: 80rpx;

    .logo-text {
      font-size: 80rpx;
      font-weight: bold;
      color: #fe2c55;
      margin-bottom: 20rpx;
      letter-spacing: 4rpx;
    }

    .slogan {
      font-size: 28rpx;
      color: #999;
      letter-spacing: 4rpx;
    }
  }

  .login-form {
    .input-group {
      display: flex;
      align-items: center;
      height: 100rpx;
      border-bottom: 1rpx solid #f0f0f0;
      margin-bottom: 30rpx;

      .country-code {
        font-size: 32rpx;
        color: #333;
        margin-right: 20rpx;
      }

      .phone-input,
      .code-input {
        flex: 1;
        height: 100%;
        font-size: 32rpx;
      }

      .get-code {
        font-size: 28rpx;
        color: #999;
        padding-left: 30rpx;

        &.disabled {
          color: #999;
        }

        &.active {
          color: #fe2c55;
        }

        &.requesting {
          opacity: 0.5;
        }
      }
    }

    .input-placeholder {
      color: #999;
      font-size: 32rpx;
    }

    .login-btn {
      width: 100%;
      height: 88rpx;
      line-height: 88rpx;
      text-align: center;
      background-color: #ffd6d9;
      color: #fff;
      font-size: 32rpx;
      border-radius: 44rpx;
      margin: 60rpx 0;

      &.active {
        background-color: #fe2c55;
      }
    }

    .agreement {
      .agreement-label {
        display: flex;
        align-items: flex-start;

        .checkbox {
          transform: scale(0.7);
          margin-right: 4rpx;
        }

        .agreement-text {
          font-size: 24rpx;
          color: #999;
          line-height: 1.4;

          .link {
            color: #333;
          }
        }
      }
    }
  }
}
</style> 