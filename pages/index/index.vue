<script>
import { mapActions } from 'vuex'

export default {
  onLoad() {
    this.checkLogin()
  },

  methods: {
    ...mapActions('user', ['checkLoginStatus']),

    async checkLogin() {
      try {
        const isLogin = await this.checkLoginStatus()
        if (!isLogin) {
          // 处理未登录状态，比如跳转到登录页
          uni.redirectTo({
            url: '/pages/login/login'
          })
        }
      } catch (error) {
        console.error('登录状态检查失败:', error)
      }
    }
  }
}
</script> 