export const refreshToken = async (data) => {
    // 检查是否有 code
    if (!data.code) {
      return {
        code: 400,
        message: '缺少登录凭证'
      }
    }

    // 模拟成功响应
    return {
      code: 0,
      message: 'success',
      data: {
        token: 'mock_token_' + Date.now(),
        expires: Date.now() + 7200000 // 2小时后过期
      }
    }
}