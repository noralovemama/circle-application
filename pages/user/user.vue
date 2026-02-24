<template>
	<view class="user-container">
		<!-- 顶部导航栏 -->
		<view class="nav-header">
			<view class="left-btn" @click="goBack">返回</view>
			<text class="header-title">个人信息</text>
			<view class="right-placeholder"></view>
		</view>

		<!-- 用户基本信息 -->
		<view class="user-info">
			<!-- 头像选择 -->
			<button class="avatar-wrapper">
				<image v-if="tempUserInfo.avatar" :src="tempUserInfo.avatar" class="avatar-image" mode="aspectFill" />
				<view v-else class="avatar-placeholder">
					<text>头像</text>
				</view>
			</button>

			<!-- 昵称输入 -->
			<input type="nickname" v-model="tempUserInfo.nickname"
				:placeholder="showNicknameTip ? '请输入昵称' : defaultNickname" disabled="true"
				class="nickname-input" :class="{ 'highlight': showNicknameTip }" />
		</view>

		<!-- 提示信息 -->
		<view v-if="showNicknameTip" class="tip-text">
			请设置昵称
		</view>

		<!-- 功能列表 -->
		<view class="function-list">
			<view class="function-item" @click="navigateToProfileDetail">
				<text>我的信息</text>
				<uni-icons type="right" size="16" color="#999"></uni-icons>
			</view>

			<view class="function-item" @click="handleMyCircles">
				<text>我的圈子</text>
				<uni-icons type="right" size="16" color="#999"></uni-icons>
			</view>
		</view>
	</view>
</template>

<script>
	import { useUserStore } from '@/store/user'
	
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
					nickname: ''
				},
				showNicknameTip: false
			}
		},

		onLoad() {
			this.loadUserProfile()
		},
		onShow(){
			this.loadUserProfile()
		},

		methods: {
			async loadUserProfile() {
				try {
					// 优先从store获取用户信息
					if (this.userStore.userInfo.userName) {
						this.defaultNickname = this.userStore.userInfo.userName
						this.tempUserInfo.nickname = this.userStore.userInfo.userName
						this.tempUserInfo.avatar = this.userStore.userInfo.image
						return
					}
					
					// 如果store中没有，则调用API获取
					await this.userStore.getUserDetail()
					if (this.userStore.userInfo.userName) {
						this.defaultNickname = this.userStore.userInfo.userName
						this.tempUserInfo.nickname = this.userStore.userInfo.userName
						this.tempUserInfo.avatar = this.userStore.userInfo.image
					}
				} catch (error) {
					console.log('用户未创建个人信息')
				}
			},

			goBack() {
				const pages = getCurrentPages()
				if (pages.length > 1) {
					uni.navigateBack()
				}
			},

			navigateTo(url) {
				console.log('跳转到:', url)
				uni.navigateTo({
					url,
					fail: (err) => {
						console.error('跳转失败:', err)
						uni.showToast({
							title: '页面跳转失败',
							icon: 'none'
						})
					}
				})
			},

			handleMyCircles() {
				// 通过 url 传递参数
				uni.reLaunch({
					url: '/pages/circle/circle?type=my'
				})
			},

			navigateToProfileDetail() {
				console.log('跳转到profileDetail页面')
				// 先尝试简单的跳转
				try {
					uni.navigateTo({
						url: '/pages/profile/profileDetail',
						success: () => {
							console.log('跳转成功')
						},
						fail: (err) => {
							console.error('navigateTo失败:', err)
							// 如果失败，尝试使用switchTab（虽然这不是tab页面）
							uni.showToast({
								title: '页面跳转失败，请检查页面配置',
								icon: 'none'
							})
						}
					})
				} catch (error) {
					console.error('跳转异常:', error)
					uni.showToast({
						title: '跳转异常',
						icon: 'none'
					})
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	.user-container {
		min-height: 100vh;
		background-color: #f8f8f8;

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

		.function-list {
			margin-top: 12px;
			background-color: #fff;

			.function-item {
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: 16px;
				border-bottom: 1px solid #f5f5f5;
				font-size: 16px;
				color: #333;

				&:last-child {
					border-bottom: none;
				}

				&:active {
					background-color: #f5f5f5;
				}
			}
		}

		.tip-text {
			padding: 8px 20px;
			font-size: 14px;
			color: #007AFF;
		}
	}
</style>