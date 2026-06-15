<template>
	<view class="user-container">
		<!-- 顶部导航栏 -->
		<view class="nav-header">
			<view class="left-btn" @click="goBack">返回</view>
			<text class="header-title">个人信息</text>
			<view class="right-placeholder"></view>
		</view>

		<!-- 用户基本信息 -->
		<view class="user-info" @click="navigateToProfileEdit">
			<!-- 头像选择 -->
			<button class="avatar-wrapper" @click.stop="navigateToProfileEdit">
				<image v-if="tempUserInfo.avatar" :src="tempUserInfo.avatar" class="avatar-image" mode="aspectFill" />
				<view v-else class="avatar-placeholder">
					<text>头像</text>
				</view>
			</button>

			<!-- 昵称输入 -->
			<input type="nickname" v-model="tempUserInfo.nickname"
				:placeholder="showNicknameTip ? '请输入昵称' : defaultNickname"
				@focus="navigateToProfileEdit"
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
	import { normalizeImageForDisplay } from '@/utils/image'
	
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
					const isLoggedIn = await this.userStore.checkLoginStatus()
					if (!isLoggedIn) return
					await this.userStore.getUserDetail()
					const userInfo = this.userStore.userInfo || {}
					this.defaultNickname = userInfo.userName || '用户名XXX'
					this.tempUserInfo.nickname = userInfo.userName || ''
					this.tempUserInfo.avatar = normalizeImageForDisplay(userInfo.image)
					this.showNicknameTip = !userInfo.userName
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
				uni.setStorageSync('circleListType', 'my')
				uni.switchTab({
					url: '/pages/circle/circle'
				})
			},

			navigateToProfileEdit() {
				uni.navigateTo({
					url: '/pages/profile/profileNew'
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

<style lang="scss" scoped>
	.user-container {
		min-height: 100vh;
		background:
			radial-gradient(circle at top left, rgba(255, 255, 255, 0.95), transparent 34%),
			radial-gradient(circle at bottom right, rgba(231, 200, 171, 0.72), transparent 32%),
			linear-gradient(160deg, #f7f1eb 0%, #efe2d4 46%, #ead8c6 100%) !important;
		color: #2f241d;
		box-sizing: border-box;
	}

	.user-container .nav-header {
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

	.user-container .left-btn {
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

	.user-container .header-title {
		flex: 1;
		color: #2f241d !important;
		font-size: 17px !important;
		font-weight: 900 !important;
		line-height: 1.35;
		text-align: center;
	}

	.user-container .right-placeholder {
		width: 54px !important;
	}

	.user-container .user-info,
	.user-container .function-list {
		margin: 18px 18px 0 !important;
		border: 1px solid rgba(82, 49, 31, 0.12);
		border-radius: 22px;
		background: #fffaf5 !important;
		box-shadow: 0 10px 24px rgba(98, 63, 36, 0.06);
	}

	.user-container .user-info {
		padding: 18px !important;
	}

	.user-container .avatar-wrapper {
		width: 72px !important;
		height: 72px !important;
		border: 0 !important;
		border-radius: 22px !important;
		background: #f4e7dc !important;
		box-shadow: 0 10px 22px rgba(111, 61, 29, 0.12);
	}

	.user-container .avatar-wrapper::after {
		border: none;
	}

	.user-container .avatar-image {
		width: 100%;
		height: 100%;
	}

	.user-container .avatar-placeholder {
		background: #f7eadf;
		color: #8a766a !important;
		font-size: 13px !important;
		font-weight: 800;
	}

	.user-container .nickname-input {
		min-width: 0;
		height: 44px;
		padding: 0 !important;
		color: #2f241d !important;
		font-size: 20px !important;
		font-weight: 900;
		line-height: 44px;
	}

	.user-container .nickname-input.highlight {
		border-bottom: 1px solid #9c5b2e !important;
	}

	.user-container .tip-text {
		margin: 8px 18px 0;
		padding: 0 2px !important;
		color: #9c5b2e !important;
		font-size: 13px !important;
		font-weight: 800;
	}

	.user-container .function-list {
		overflow: hidden;
		background: #fffaf5 !important;
	}

	.user-container .function-item {
		padding: 18px !important;
		border-bottom: 1px solid rgba(82, 49, 31, 0.08) !important;
		color: #2f241d !important;
		font-size: 15px !important;
		font-weight: 900;
	}

	.user-container .function-item:active {
		background: #fff4ea !important;
	}

	.user-container .function-item:last-child {
		border-bottom: none !important;
	}
</style>
