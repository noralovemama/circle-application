# 用户信息Store使用指南

## 概述

用户信息现在统一存储在Pinia store中，登录后会自动调用 `/user/detail` 接口获取用户详情并存储在store中，方便其他页面使用。

## Store结构

### 状态 (State)
```javascript
{
  token: '', // 用户token
  expireAt: '', // token过期时间
  userName: '', // 用户名
  userInfo: {
    userId: '', // 用户ID
    userName: '', // 用户名
    image: '', // 头像
    age: '', // 年龄
    company: '', // 公司
    position: '', // 岗位
    school: '', // 学校
    introduction: '', // 个人介绍
    personality: '', // 性格类型
    question: '', // 自定义问题
    answer: '' // 自定义答案
  },
  isLogin: false // 登录状态
}
```

## 使用方法

### 1. 在页面中引入store

```javascript
import { useUserStore } from '@/store/user'

export default {
  setup() {
    const userStore = useUserStore()
    return {
      userStore
    }
  }
}
```

### 2. 获取用户信息

```javascript
// 直接获取用户信息
const userName = this.userStore.userInfo.userName
const userAvatar = this.userStore.userInfo.image

// 检查是否已登录
if (this.userStore.isLogin) {
  // 用户已登录
}

// 获取token
const token = this.userStore.token
```

### 3. 主动获取用户详情

```javascript
// 如果store中没有用户信息，主动获取
async loadUserInfo() {
  try {
    await this.userStore.getUserDetail()
    // 获取成功后，userInfo会自动更新
  } catch (error) {
    console.log('获取用户信息失败:', error)
  }
}

// 或者使用ensureUserInfo方法（推荐）
async ensureUserInfo() {
  try {
    await this.userStore.ensureUserInfo()
    // 如果store中没有用户信息，会自动获取
  } catch (error) {
    console.log('确保用户信息失败:', error)
  }
}
```

### 4. 在模板中使用

```vue
<template>
  <view>
    <image :src="userStore.userInfo.image || '/static/default-avatar.png'" />
    <text>{{ userStore.userInfo.userName || '未设置昵称' }}</text>
  </view>
</template>
```

## 自动获取机制

### 登录时自动获取
登录成功后会自动调用 `getUserDetail()` 方法获取用户详情：

```javascript
// 在登录成功后
await this.userStore.getUserDetail()
```

### 页面加载时检查
在页面 `onLoad` 或 `onShow` 中可以检查并获取用户信息：

```javascript
onLoad() {
  this.loadUserInfo()
},

methods: {
  async loadUserInfo() {
    // 优先使用store中的数据
    if (this.userStore.userInfo.userName) {
      return
    }
    
    // 如果store中没有，则获取
    await this.userStore.getUserDetail()
  }
}
```

## 优势

1. **统一管理**：所有用户信息集中存储在store中
2. **减少API调用**：避免重复请求用户信息
3. **数据一致性**：所有页面使用同一份用户数据
4. **性能优化**：减少网络请求，提升用户体验
5. **易于维护**：用户信息变更只需要更新store

## 注意事项

1. 登录后会自动获取用户详情，但新用户可能没有详细信息
2. 如果获取用户详情失败，不会影响登录状态
3. 用户信息更新后，需要重新调用 `getUserDetail()` 刷新store中的数据
4. 建议在页面加载时检查store中是否有用户信息，没有则主动获取
5. 在需要用户信息的操作前（如发表评论），建议调用 `ensureUserInfo()` 确保信息完整

## 最佳实践

### 在需要用户信息的操作前确保信息完整

```javascript
// 在发表评论、创建圈子等操作前
async submitComment() {
  try {
    // 确保用户信息完整
    await this.userStore.ensureUserInfo()
    
    // 然后进行相关操作
    const res = await api.someOperation({
      userId: this.userStore.userInfo.userId,
      userName: this.userStore.userInfo.userName,
      // ... 其他参数
    })
  } catch (error) {
    console.error('操作失败:', error)
  }
}
```

### 在用户交互入口处预先获取用户信息

```javascript
// 在显示评论弹框前预先获取用户信息
async showCommentModal() {
  try {
    // 显示加载提示
    uni.showLoading({ title: '加载中...' })
    
    // 在显示弹框前确保用户信息完整
    await this.userStore.ensureUserInfo()
    
    uni.hideLoading()
    // 显示弹框
    this.$refs.commentPopup.open()
  } catch (error) {
    uni.hideLoading()
    uni.showToast({
      title: '获取用户信息失败，请重试',
      icon: 'none'
    })
  }
}
```

### 评论提交后的刷新流程

```javascript
// 提交评论并刷新圈子详情
async submitComment() {
  try {
    // 1. 确保用户信息完整
    await this.userStore.ensureUserInfo()
    
    // 2. 验证用户信息完整性
    if (!this.validateUserInfo()) {
      return
    }
    
    // 3. 显示提交中提示
    uni.showLoading({ title: '提交中...' })
    
    // 4. 构建评论数据并提交
    const commentData = this.buildCommentData('create')
    const res = await circleApi.updateCircleMessage(commentData)
    
    if (res.status === 10000) {
      // 5. 提交成功后刷新圈子详情
      uni.hideLoading()
      uni.showLoading({ title: '刷新中...' })
      const refreshSuccess = await this.refreshCircleDetail()
      uni.hideLoading()
      
      if (refreshSuccess) {
        uni.showToast({ title: '发表成功', icon: 'success' })
      }
    }
  } catch (error) {
    uni.hideLoading()
    console.error('提交评论失败:', error)
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}
```

### 圈子留言API参数说明

```javascript
// 圈子留言操作需要的参数
const messageData = {
  circleId: '圈子ID',
  content: '留言内容',
  userId: '用户ID',
  userName: '用户名称', // 必需参数
  userImage: '纯base64用户头像', // 必需参数，不带 data:image 前缀，不传远程URL
  messageId: '留言ID', // 编辑/删除时必需
  status: 1 // 必需参数：1-生效/0-删除
}

// 提交评论示例
async submitComment() {
  try {
    // 确保用户信息完整
    await this.userStore.ensureUserInfo()
    
    const res = await circleApi.updateCircleMessage({
      circleId: this.circle.circleId,
      content: this.commentContent,
      userId: this.userId,
      userName: this.userStore.userInfo.userName, // 从store获取用户名称
      userImage: toSubmittableImageBase64(this.userStore.userInfo.image), // 只提交纯base64头像
      status: 1 // 生效状态
    })
  } catch (error) {
    console.error('提交评论失败:', error)
  }
}

// 删除评论示例
async deleteComment() {
  const res = await circleApi.updateCircleMessage({
    messageId: comment.messageId,
    circleId: this.circle.circleId,
    userId: this.userId,
    userName: this.userStore.userInfo.userName,
    userImage: toSubmittableImageBase64(this.userStore.userInfo.image),
    status: 0 // 删除状态
  })
}
```
