<template>
	<view class="user-container">
		<view class="nav-header">
			<view class="left-btn" @click="goBack">返回</view>
			<text class="header-title">我的资料</text>
			<view class="right-placeholder"></view>
		</view>

		<view class="profile-card" @click="navigateToProfileEdit">
			<view class="avatar-shell">
				<image v-if="tempUserInfo.avatar" :src="tempUserInfo.avatar" class="avatar-image" mode="aspectFill" />
				<view v-else class="avatar-placeholder">
					<text>{{ profileInitial }}</text>
				</view>
			</view>
			<view class="profile-main">
				<text class="profile-name">{{ displayName }}</text>
				<text class="profile-subtitle">{{ profileSubtitle }}</text>
			</view>
			<view class="profile-action">
				<text class="profile-action-text">{{ showNicknameTip ? '去完善' : '编辑' }}</text>
			</view>
		</view>

		<view class="tip-banner" v-if="showNicknameTip">
			<text>先补一个昵称和头像，别人会更容易记住你。</text>
		</view>

		<view class="next-step-card">
			<view class="next-step-copy">
				<text class="next-step-title">{{ showNicknameTip ? '先完善资料，再去加入一局' : '资料准备好了，去看看附近在组什么局' }}</text>
				<text class="next-step-desc">{{ showNicknameTip ? '补完整以后，别人会更容易决定要不要和你一起聊。' : '从主题、时间和距离里挑一局合适的，先留言再决定要不要见面。' }}</text>
			</view>
			<button class="next-step-btn" @click="handleNextStep">{{ showNicknameTip ? '去完善资料' : '去看看圈子' }}</button>
		</view>

		<view class="function-list">
			<view class="section-title">资料与记录</view>
			<view class="function-item" @click="navigateToProfileDetail">
				<view class="function-copy">
					<text class="function-label">查看完整资料</text>
					<text class="function-desc">检查你对外展示的资料内容</text>
				</view>
				<uni-icons type="right" size="16" color="#8a766a"></uni-icons>
			</view>

			<view class="function-item" @click="handleMyCircles">
				<view class="function-copy">
					<text class="function-label">我的圈子</text>
					<text class="function-desc">查看我发起和加入的小局</text>
				</view>
				<uni-icons type="right" size="16" color="#8a766a"></uni-icons>
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
				tempUserInfo: {
					avatar: '',
					nickname: ''
				},
				showNicknameTip: false
			}
		},
		computed: {
			displayName() {
				const nickname = String(this.tempUserInfo.nickname || '').trim()
				return nickname || '还没设置昵称'
			},
			profileSubtitle() {
				if (this.showNicknameTip) {
					return '补充头像、昵称和基本信息，让资料更完整'
				}
				return '点进去可以更新头像、昵称和个人介绍'
			},
			profileInitial() {
				const nickname = String(this.tempUserInfo.nickname || '').trim()
				return nickname ? nickname.slice(0, 1) : '我'
			}
		},

		onLoad() {
			this.loadUserProfile()
		},
		onShow() {
			this.loadUserProfile()
		},

		methods: {
			async loadUserProfile() {
				try {
					const isLoggedIn = await this.userStore.checkLoginStatus()
					if (!isLoggedIn) return
					await this.userStore.getUserDetail()
					const userInfo = this.userStore.userInfo || {}
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
				try {
					uni.navigateTo({
						url: '/pages/profile/profileDetail',
						fail: (err) => {
							console.error('navigateTo失败:', err)
							uni.showToast({
								title: '页面跳转失败',
								icon: 'none'
							})
						}
					})
				} catch (error) {
					console.error('跳转异常:', error)
					uni.showToast({
						title: '页面跳转失败',
						icon: 'none'
					})
				}
			},

			handleNextStep() {
				if (this.showNicknameTip) {
					this.navigateToProfileEdit()
					return
				}
				uni.switchTab({
					url: '/pages/circle/circle'
				})
			}
		}
	}
</script>

<style lang="scss" scoped>
	.user-container {
		min-height: 100vh;
		background:
			radial-gradient(circle at top left, rgba(255, 255, 255, 0.95), transparent 34%),
			radial-gradient(circle at bottom right, rgba(216, 194, 174, 0.68), transparent 34%),
			linear-gradient(160deg, #f7f3ee 0%, #efe4d8 48%, #e6d7c8 100%);
		color: #30261f;
		box-sizing: border-box;
		padding-bottom: 36px;
	}

	.nav-header {
		position: sticky;
		top: 0;
		z-index: 10;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: calc(var(--status-bar-height) + 10px) 16px 12px;
		border-bottom: 1px solid rgba(82, 49, 31, 0.1);
		background: rgba(255, 250, 245, 0.88);
		backdrop-filter: blur(18px);
	}

	.left-btn {
		min-width: 52px;
		height: 30px;
		line-height: 30px;
		padding: 0 10px;
		border: 1px solid rgba(111, 61, 29, 0.1);
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.72);
		box-shadow: 0 4px 12px rgba(111, 61, 29, 0.05);
		color: #7b5f48;
		font-size: 12px;
		font-weight: 700;
		text-align: center;
	}

	.header-title {
		flex: 1;
		font-size: 17px;
		font-weight: 800;
		line-height: 30px;
		text-align: center;
		letter-spacing: -0.2px;
	}

	.right-placeholder {
		width: 52px;
	}

	.profile-card,
	.function-list {
		margin: 20px 20px 0;
		border: 1px solid rgba(82, 49, 31, 0.12);
		border-radius: 24px;
		background: rgba(255, 250, 245, 0.96);
		box-shadow: 0 10px 24px rgba(103, 77, 58, 0.06);
	}

	.profile-card {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 24px 20px;
	}

	.avatar-shell {
		width: 76px;
		height: 76px;
		border-radius: 24px;
		overflow: hidden;
		background: linear-gradient(180deg, #efe2d7 0%, #e4d0be 100%);
		box-shadow: 0 10px 22px rgba(111, 84, 63, 0.12);
		flex-shrink: 0;
	}

	.avatar-image,
	.avatar-placeholder {
		width: 100%;
		height: 100%;
	}

	.avatar-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		color: #7d6a5c;
		font-size: 28px;
		font-weight: 900;
	}

	.profile-main {
		flex: 1;
		min-width: 0;
	}

	.profile-name {
		display: block;
		font-size: 24px;
		font-weight: 900;
		line-height: 32px;
		color: #30261f;
	}

	.profile-subtitle {
		display: block;
		margin-top: 8px;
		font-size: 13px;
		line-height: 20px;
		color: #7d6a5c;
	}

	.profile-action {
		flex-shrink: 0;
		padding: 9px 14px;
		border-radius: 999px;
		background: #fff;
		border: 1px solid rgba(111, 61, 29, 0.12);
	}

	.profile-action-text {
		font-size: 12px;
		font-weight: 800;
		color: #7b5f48;
	}

	.tip-banner {
		margin: 12px 20px 0;
		padding: 12px 14px;
		border-radius: 16px;
		background: rgba(140, 102, 76, 0.08);
		color: #7b5f48;
		font-size: 13px;
		line-height: 20px;
	}

	.next-step-card {
		margin: 16px 20px 0;
		padding: 18px 20px;
		border-radius: 22px;
		background: linear-gradient(135deg, rgba(255, 250, 245, 0.96), rgba(249, 239, 228, 0.96));
		border: 1px solid rgba(123, 95, 73, 0.12);
		box-shadow: 0 10px 24px rgba(103, 77, 58, 0.06);
	}

	.next-step-copy {
		min-width: 0;
	}

	.next-step-title {
		display: block;
		color: #30261f;
		font-size: 16px;
		font-weight: 900;
		line-height: 24px;
	}

	.next-step-desc {
		display: block;
		margin-top: 6px;
		color: #7d6a5c;
		font-size: 13px;
		line-height: 20px;
	}

	.next-step-btn {
		width: 100%;
		height: 44px;
		line-height: 44px;
		margin: 14px 0 0;
		padding: 0 16px;
		border: 0;
		border-radius: 16px;
		background: #4d392b;
		color: #ffffff;
		font-size: 14px;
		font-weight: 900;

		&::after {
			border: none;
		}
	}

	.function-list {
		overflow: hidden;
		padding: 8px 0;
	}

	.section-title {
		padding: 12px 20px 8px;
		font-size: 12px;
		font-weight: 800;
		letter-spacing: 1px;
		color: #7d6a5c;
	}

	.function-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 14px;
		padding: 18px 20px;
		border-bottom: 1px solid rgba(82, 49, 31, 0.08);
	}

	.function-item:last-child {
		border-bottom: none;
	}

	.function-item:active {
		background: #fff4ea;
	}

	.function-copy {
		flex: 1;
		min-width: 0;
	}

	.function-label {
		display: block;
		font-size: 16px;
		font-weight: 800;
		line-height: 24px;
		color: #30261f;
	}

	.function-desc {
		display: block;
		margin-top: 4px;
		font-size: 13px;
		line-height: 20px;
		color: #7d6a5c;
	}
</style>
