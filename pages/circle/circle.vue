<template>
	<view class="container">
		<view class="ambient ambient-one"></view>
		<view class="ambient ambient-two"></view>

		<scroll-view class="scroll-view" scroll-y @scrolltolower="loadMore">
			<view class="page-content">

				<view class="hero-card">
					<view class="hero-eyebrow">小群友</view>
					<text class="hero-title">{{ getListFlag() === 1 ? '看看你发起和加入的小局' : '和对的人约一杯咖啡，认真聊一次天' }}</text>
					<text class="hero-copy">{{ getListFlag() === 1 ? '这里会收起你正在参与的局，也方便你继续回看、补充和分享。' : '固定 6 人，先聊共同兴趣，再决定要不要见面。每一局都轻一点，也真一点。' }}</text>
					<view class="hero-points">
						<text class="hero-point">{{ getListFlag() === 1 ? '继续留言' : '固定 6 人' }}</text>
						<text class="hero-point">{{ getListFlag() === 1 ? '回看安排' : '先留言再见面' }}</text>
						<text class="hero-point">{{ getListFlag() === 1 ? '补充细节' : '聊得来再去见朋友' }}</text>
					</view>
				</view>

				<view class="cta-stack">
					<button class="button-soft" @click="createCircle">{{ getListFlag() === 1 ? '再发起一局' : '我来组一局' }}</button>
				</view>

				<view v-if="getListFlag() !== 1" class="guide-card">
					<text class="guide-title">第一次来，先看这三件事</text>
					<view class="guide-list">
						<view class="guide-item">
							<text class="guide-index">1</text>
							<text class="guide-copy">先看主题是不是你真想聊的</text>
						</view>
						<view class="guide-item">
							<text class="guide-index">2</text>
							<text class="guide-copy">再看时间、距离和还有几席</text>
						</view>
						<view class="guide-item">
							<text class="guide-index">3</text>
							<text class="guide-copy">合适就加入，留言里先打个招呼</text>
						</view>
					</view>
				</view>

				<view v-if="showProfilePrompt" class="profile-prompt-card">
					<view class="profile-prompt-copy">
						<text class="profile-prompt-title">先补个昵称和头像，再去加入更顺</text>
						<text class="profile-prompt-desc">别人会先看你的昵称、头像和基本资料。补完整以后，更容易决定要不要跟你一起聊。</text>
					</view>
					<button class="profile-prompt-btn" @click="goCompleteProfile">去完善资料</button>
				</view>

				<view class="section list-section">
					<view class="section-head">
						<text class="section-title">{{ getListFlag() === 1 ? '我的圈子' : '附近正在组局' }}</text>
						<text class="section-subtitle">{{ getListFlag() === 1 ? '回到你已经参与的局' : '挑一个你想加入的话题' }}</text>
					</view>
					<view class="list">
						<view
							class="group-card"
							:class="{ 'group-card-disabled': isCircleStarted(item) }"
							v-for="item in circleStore.list"
							:key="item.circleId"
						>
							<view class="group-top">
								<image
									class="avatar"
									:class="{ 'avatar-disabled': isCircleStarted(item) }"
									:src="getAvatar(item)"
									mode="aspectFill"
									@click.stop="navigateToUserProfile(item)"
								/>
								<view class="group-info">
									<text class="owner">{{ getOwnerName(item) }} · 发起</text>
									<text class="group-title">{{ item.circleName }}</text>
								</view>
							</view>

							<text class="group-copy">{{ getCircleSummary(item) }}</text>
							<view class="group-meta">
								<text class="meta-pill">{{ getDistanceLabel(item) }}</text>
								<text class="meta-pill">{{ formatActivityLabel(item.activityTime || item.createTime) }}</text>
								<text class="meta-pill">{{ getMemberLabel(item) }}</text>
								<text v-if="isCircleStarted(item)" class="meta-pill muted">已开始</text>
							</view>
							<view class="tag-row">
								<text class="tag" v-for="tag in getCircleTags(item)" :key="tag">{{ tag }}</text>
							</view>
							<text class="group-hint">{{ getDecisionHint(item) }}</text>

							<button
								class="view-btn"
								:class="{ 'view-btn-disabled': isCircleStarted(item) }"
								:disabled="isCircleStarted(item)"
								@click.stop="navigateToDetail(item)"
							>
								{{ isCircleStarted(item) ? '已开始' : '查看这局' }}
							</button>
						</view>
					</view>

					<view class="empty-card error-card" v-if="!circleStore.loading && circleStore.error">
						<text class="empty-title">圈子列表加载失败</text>
						<text class="empty-copy">{{ circleStore.error }}</text>
						<button class="retry-btn" @click="retryLoad">重新加载</button>
					</view>

					<view class="empty-card" v-else-if="!circleStore.loading && circleStore.list.length === 0">
						<text class="empty-title">暂时还没有圈子</text>
						<text class="empty-copy">可以先发起一个 6 人小局，看看附近有没有志同道合的人。</text>
					</view>
				</view>

				<view class="loading" v-if="circleStore.loading">加载中...</view>
				<view class="no-more" v-if="!circleStore.loading && !circleStore.error && circleStore.list.length > 0 && !circleStore.pagination.hasMore">
					没有更多了
				</view>

			</view>
		</scroll-view>
	</view>
</template>

<script>
	import {
		useCircleStore
	} from '@/store/circle'
	import {
		useUserStore
	} from '@/store/user'
	import {
		userApi,
		circleApi
	} from '@/request/api'
	import { normalizeImageForDisplay, pad2 } from '@/utils/image'

	export default {
		setup() {
			const circleStore = useCircleStore()
			const userStore = useUserStore()
			return {
				circleStore,
				userStore
			}
		},

		data() {
			return {
				list: [],
				pagination: {
					current: 1,
					size: 10,
					total: 0
				},
				loading: false,
				refreshing: false,
				isFromHome: true,
				currentListParams: null,
				pageOptions: null // 保存页面参数
			}
		},
		computed: {
			showProfilePrompt() {
				const userInfo = (this.userStore && this.userStore.userInfo) || {}
				return !String(userInfo.userName || '').trim() || !String(userInfo.image || '').trim()
			}
		},

		async onLoad(options) {
			console.log('页面加载参数:', options)
			this.pageOptions = options // 保存页面参数
			await this.loadCurrentPage(options)
		},
		async onShow(){
			console.log('onShow 触发，pageOptions:', this.pageOptions)
			const storedListType = uni.getStorageSync('circleListType')
			if (storedListType) {
				uni.removeStorageSync('circleListType')
				this.pageOptions = {
					type: storedListType
				}
				await this.loadCurrentPage(this.pageOptions)
				return
			}
			// 检查是否需要刷新数据
			if (this.circleStore.needRefresh) {
				console.log('检测到需要刷新，重新加载数据')
				this.circleStore.clearNeedRefresh()
				await this.loadCurrentPage({})
			} else if (!this.pageOptions) {
				// 只有在没有pageOptions时才重新加载默认数据
				await this.loadCurrentPage({})
			}
		},

		onUnload() {
			// 页面卸载时清除参数
			this.pageOptions = null
		},

		// 微信分享给朋友
		onShareAppMessage() {
			return {
				title: '发现有趣的圈子，快来加入吧！',
				path: '/pages/circle/circle',
				imageUrl: '/static/share-cover.png'
			}
		},

		// 微信分享到朋友圈
		onShareTimeline() {
			return {
				title: '发现有趣的圈子，快来加入吧！',
				imageUrl: '/static/share-cover.png'
			}
		},

		async onTabItemTap(item) {
			if (item.index === 0) {
				this.isFromHome = true
				uni.setNavigationBarTitle({
					title: '圈子'
				})
				await this.loadCurrentPage({})
			}
		},

		methods: {
			// 判断圈子是否已开始
			isCircleStarted(item) {
				const activityDate = this.parseCircleDate(item.activityTime)
				return activityDate ? Date.now() > activityDate.getTime() : false
			},

			parseCircleDate(value) {
				if (!value) return null

				if (typeof value === 'number') {
					const timestamp = value < 1000000000000 ? value * 1000 : value
					const date = new Date(timestamp)
					return isNaN(date.getTime()) ? null : date
				}

				if (typeof value === 'string' && /^\d+$/.test(value)) {
					const timestamp = Number(value)
					const date = new Date(timestamp < 1000000000000 ? timestamp * 1000 : timestamp)
					return isNaN(date.getTime()) ? null : date
				}

				const normalizedValue = String(value).replace(/-/g, '/').replace('T', ' ')
				const date = new Date(normalizedValue)
				return isNaN(date.getTime()) ? null : date
			},
			async loadCurrentPage(options){
				console.log('loadCurrentPage options:', options)
				this.isFromHome = true

				uni.setNavigationBarTitle({
					title: '圈子'
				})

				const userId = await this.requireLoginForList()
				if (!userId) return

				// #ifdef MP-WEIXIN
				if (uni.getSystemInfoSync().platform === 'devtools') {
					console.log('模拟器环境，使用默认位置信息')
					this.loadCircleListWithLocation({
						userId,
						longitude: 116.24145697699653,
						latitude: 39.93208468967014
					})
					return
				}
				// #endif

				uni.getLocation({
					type: 'gcj02',
					success: ({
						longitude,
						latitude
					}) => {
						this.loadCircleListWithLocation({ userId, longitude, latitude })
					},
					fail: (err) => {
						console.error('获取位置失败，使用默认位置加载圈子列表：', err)
						this.loadCircleListWithLocation({
							userId,
							longitude: 116.24145697699653,
							latitude: 39.93208468967014
						})
					}
				})
			},

			async requireLoginForList() {
				const isLoggedIn = await this.userStore.checkLoginStatus()
				if (!isLoggedIn) {
					this.circleStore.list = []
					this.circleStore.error = null
					return ''
				}
				try {
					await this.userStore.getUserDetail()
				} catch (error) {
					console.log('用户资料暂时未加载完成:', error)
				}
				return await this.userStore.getUserId()
			},

			loadCircleListWithLocation({ userId, longitude, latitude }) {
				const flag = this.getListFlag()
				this.currentListParams = { userId, longitude, latitude, flag }
				this.circleStore.getCircleList({
					isRefresh: true,
					userId,
					longitude,
					latitude,
					flag
				})
			},
			loadMore() {
				if (!this.currentListParams || this.circleStore.loading || this.circleStore.refreshing || !this.circleStore.pagination.hasMore) {
					return
				}
				this.circleStore.getCircleList({
					isRefresh: false,
					...this.currentListParams
				})
			},

			retryLoad() {
				this.loadCurrentPage(this.pageOptions || {})
			},

			getListFlag() {
				return this.pageOptions && this.pageOptions.type === 'my' ? 1 : 0
			},

			getAvatar(item) {
				return normalizeImageForDisplay(item.ownerImage, '/static/default-avatar.png')
			},

			getOwnerName(item) {
				return item.ownerName ? item.ownerName : "某某"
			},

			getCircleSummary(item) {
				return item.introduction || item.slogan || '先因为共同兴趣坐下来，再慢慢认识彼此。固定 6 人，轻松开场，也保留一点深入交流的机会。'
			},

			getDistanceLabel(item) {
				if (item.distance === undefined || item.distance === null || item.distance === '') {
					return '附近'
				}
				const distance = Number(item.distance)
				if (isNaN(distance)) return `${item.distance}公里`
				return `${distance.toFixed(distance < 10 ? 1 : 0)} km`
			},

			getMemberLabel(item) {
				const members = item.circleUserItemList || item.userList || item.members || []
				let current = members.length || 1
				if (item.memberCount !== undefined && item.memberCount !== null) current = item.memberCount
				if (item.currentMembers !== undefined && item.currentMembers !== null) current = item.currentMembers
				const max = item.maxMembers || 6
				return `${current}/${max} 人`
			},

			getCircleTags(item) {
				const source = [item.topic, item.slogan, item.activityLocation].filter(Boolean)
				const tags = source.slice(0, 3)
				return tags.length ? tags : ['固定 6 人', '先聊再见', '共同兴趣']
			},

			getDecisionHint(item) {
				const members = item.circleUserItemList || item.userList || item.members || []
				const currentMembers = item.memberCount !== undefined && item.memberCount !== null
					? Number(item.memberCount)
					: (item.currentMembers !== undefined && item.currentMembers !== null ? Number(item.currentMembers) : members.length || 1)
				const maxMembers = Number(item.maxMembers || 6)
				const spotsLeft = Math.max(0, maxMembers - currentMembers)
				const budget = Number(item.money || item.budget || 0)

				if (spotsLeft <= 1) return '快满员了，感兴趣的话可以早点加入，先在留言区打个招呼。'
				if (currentMembers <= 2) return '现在人还不多，适合先加入，慢慢把聊天氛围带起来。'
				if (!budget) return '门槛比较低，适合第一次先试着参加一局。'
				if (item.activityLocation) return '地点已经写得比较明确，方便你判断值不值得专门过去。'
				return '先看主题和时间，合适再加入，会比盲目社交轻松很多。'
			},

			formatActivityLabel(value) {
				const date = this.parseCircleDate(value)
				if (!date) return '时间待定'
				const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
				const hours = pad2(date.getHours())
				const minutes = pad2(date.getMinutes())
				return `${weekdays[date.getDay()]} ${hours}:${minutes}`
			},

			async createCircle() {
				const isLoggedIn = await this.userStore.checkLoginStatus()
				if (!isLoggedIn) return

				uni.navigateTo({
					url: '/pages/circle/create'
				})
			},

			goCompleteProfile() {
				uni.navigateTo({
					url: '/pages/profile/profileNew'
				})
			},

			navigateToDetail(item) {
				// 如果圈子已开始，不允许查看
				if (this.isCircleStarted(item)) {
					uni.showToast({
						title: '该圈子已开始，无法查看',
						icon: 'none'
					})
					return
				}

				uni.navigateTo({
					url: `/pages/circle/detail?circleId=${item.circleId}`
				})
			},

			navigateToUserProfile(item) {
				// 跳转到用户详情页
				const userId = item.ownerId
				if (userId) {
					uni.navigateTo({
						url: `/pages/profile/profileDetail?userId=${userId}`
					})
				} else {
					uni.showToast({
						title: '用户信息不存在',
						icon: 'none'
					})
				}
			},
		}
	}
</script>

<style lang="scss" scoped>
	.container {
		position: relative;
		height: 100vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background:
			radial-gradient(circle at top left, rgba(255, 255, 255, 0.95), transparent 34%),
			radial-gradient(circle at bottom right, rgba(216, 194, 174, 0.68), transparent 34%),
			linear-gradient(160deg, #f7f3ee 0%, #efe4d8 48%, #e6d7c8 100%);
		color: #30261f;
	}

	.ambient {
		position: absolute;
		border-radius: 999px;
		pointer-events: none;
		filter: blur(2px);
		opacity: 0.8;
	}

	.ambient-one {
		top: -90px;
		right: -96px;
		width: 260px;
		height: 260px;
		background: rgba(255, 255, 255, 0.52);
	}

	.ambient-two {
		left: -120px;
		bottom: 120px;
		width: 280px;
		height: 280px;
		background: rgba(214, 191, 170, 0.42);
	}

	.scroll-view {
		position: relative;
		z-index: 1;
		flex: 1;
		height: 0;
	}

	.page-content {
		padding: calc(var(--status-bar-height) + 44px) 20px 0;
	}





	.hero-card {
		padding: 24px 20px;
		border-radius: 24px;
		background:
			radial-gradient(circle at top right, rgba(255, 255, 255, 0.34), transparent 30%),
			linear-gradient(135deg, #8d6b53 0%, #a88569 56%, #c6a68d 100%);
		box-shadow: 0 18px 35px rgba(111, 84, 63, 0.2);
		color: #fffaf6;
	}

	.hero-eyebrow {
		display: inline-flex;
		align-items: center;
		align-self: flex-start;
		padding: 7px 10px;
		margin-bottom: 14px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.16);
		font-size: 11px;
		font-weight: 800;
		letter-spacing: 1px;
	}

	.hero-title {
		display: block;
		font-size: 24px;
		font-weight: 900;
		line-height: 32px;
		letter-spacing: -0.4px;
	}

	.hero-copy {
		display: block;
		margin-top: 10px;
		font-size: 14px;
		line-height: 22px;
		color: rgba(255, 250, 246, 0.86);
	}

	.hero-points {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 16px;
	}

	.hero-point {
		min-height: 28px;
		padding: 0 10px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.14);
		color: #fffaf6;
		font-size: 12px;
		font-weight: 800;
		line-height: 28px;
	}

	.cta-stack {
		display: grid;
		gap: 10px;
		margin-top: 18px;
	}

	.guide-card {
		margin-top: 18px;
		padding: 18px 20px;
		border: 1px solid rgba(82, 49, 31, 0.12);
		border-radius: 22px;
		background: rgba(255, 250, 245, 0.92);
		box-shadow: 0 10px 24px rgba(103, 77, 58, 0.05);
	}

	.guide-title {
		display: block;
		color: #30261f;
		font-size: 16px;
		font-weight: 900;
		line-height: 24px;
	}

	.guide-list {
		margin-top: 10px;
	}

	.guide-item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 0;
	}

	.guide-index {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		border-radius: 999px;
		background: #f1e4d8;
		color: #7b5f48;
		font-size: 11px;
		font-weight: 900;
		line-height: 20px;
		flex-shrink: 0;
	}

	.guide-copy {
		color: #7d6a5c;
		font-size: 13px;
		line-height: 20px;
	}

	.profile-prompt-card {
		margin-top: 18px;
		padding: 18px 20px;
		border-radius: 22px;
		background: linear-gradient(135deg, rgba(255, 250, 245, 0.96), rgba(249, 239, 228, 0.96));
		border: 1px solid rgba(123, 95, 73, 0.12);
		box-shadow: 0 10px 24px rgba(103, 77, 58, 0.06);
	}

	.profile-prompt-copy {
		min-width: 0;
	}

	.profile-prompt-title {
		display: block;
		color: #30261f;
		font-size: 16px;
		font-weight: 900;
		line-height: 24px;
	}

	.profile-prompt-desc {
		display: block;
		margin-top: 6px;
		color: #7d6a5c;
		font-size: 13px;
		line-height: 20px;
	}

	.profile-prompt-btn {
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

	.button-soft,
	.view-btn {
		border: 0;
		border-radius: 18px;
		font-size: 15px;
		font-weight: 900;
		transition: all 160ms ease;

		&::after {
			border: none;
		}
	}

	.button-soft {
		width: 100%;
		height: 48px;
		line-height: 48px;
		margin: 0;
		padding: 0 18px;
	}


	.button-soft {
		background: rgba(255, 250, 245, 0.88);
		border: 1px solid rgba(123, 95, 73, 0.14);
		color: #7c5f49;
	}

	.button-soft:active,
	.view-btn:active,
	.group-card:active {
		transform: translateY(-1px);
	}

	.section {
		margin-top: 24px;
	}

	.section-head {
		display: block;
		margin-bottom: 14px;
	}

	.section-title {
		font-size: 18px;
		font-weight: 900;
		line-height: 26px;
		letter-spacing: -0.2px;
		color: #30261f;
	}

	.section-subtitle {
		display: block;
		margin-top: 4px;
		font-size: 13px;
		line-height: 20px;
		color: #7d6a5c;
	}

	.list {
		display: grid;
		gap: 16px;
	}

	.group-card,
	.empty-card {
		border: 1px solid rgba(82, 49, 31, 0.12);
		border-radius: 22px;
		background: #fffaf5;
		box-shadow: 0 10px 24px rgba(103, 77, 58, 0.06);
	}


	.group-title,
	.empty-title {
		display: block;
		font-size: 18px;
		font-weight: 900;
		line-height: 26px;
		letter-spacing: -0.3px;
		color: #30261f;
	}

	.group-copy,
	.empty-copy {
		display: block;
		margin-top: 8px;
		font-size: 14px;
		line-height: 22px;
		color: #7d6a5c;
	}

	.list-section {
		padding-bottom: 4px;
	}





	.group-card {
		padding: 20px;
	}

	.group-card-disabled {
		opacity: 0.62;
	}

	.group-top {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 12px;
	}

	.avatar {
		width: 44px;
		height: 44px;
		border-radius: 14px;
		background: #efe3d8;
		box-shadow: 0 8px 18px rgba(111, 84, 63, 0.12);
		flex-shrink: 0;
	}

	.avatar-disabled {
		filter: grayscale(50%);
	}

	.group-info {
		flex: 1;
		min-width: 0;
	}

	.owner {
		display: block;
		margin-bottom: 4px;
		font-size: 13px;
		line-height: 20px;
		color: #7d6a5c;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.group-title {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.group-copy {
		display: -webkit-box;
		overflow: hidden;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.group-hint {
		display: block;
		margin-top: 12px;
		color: #7b5f48;
		font-size: 13px;
		line-height: 20px;
	}

	.group-meta,
	.tag-row {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 8px;
	}

	.group-meta {
		margin-top: 16px;
	}

	.tag-row {
		margin-top: 14px;
	}

	.meta-pill,
	.tag {
		display: inline-flex;
		align-items: center;
		max-width: 100%;
		border-radius: 999px;
		font-size: 12px;
		font-weight: 800;
		line-height: 20px;
	}

	.meta-pill {
		min-height: 28px;
		padding: 4px 10px;
		background: #f1e4d8;
		color: #7b5f48;
	}

	.meta-pill.muted {
		background: #efe8e1;
		color: #97897e;
	}

	.tag {
		min-height: 28px;
		padding: 4px 10px;
		border: 1px solid rgba(123, 95, 73, 0.12);
		background: rgba(255, 255, 255, 0.92);
		color: #7d6a5c;
	}

	.view-btn {
		width: 100%;
		height: 48px;
		line-height: 48px;
		margin: 14px 0 0;
		padding: 0 18px;
		background: linear-gradient(135deg, #8c664c 0%, #72513b 100%);
		box-shadow: 0 14px 26px rgba(94, 70, 52, 0.18);
		color: #ffffff;
	}

	.view-btn-disabled {
		background: #efe7df;
		box-shadow: none;
		color: #ad9d90;
	}

	.empty-card {
		padding: 20px;
		text-align: center;
	}

	.error-card {
		border-color: rgba(140, 102, 76, 0.16);
		background: linear-gradient(135deg, #fff8f2, #f4e8dd);
	}

	.retry-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 120px;
		height: 38px;
		line-height: 38px;
		margin: 14px auto 0;
		padding: 0 16px;
		border: 0;
		border-radius: 999px;
		background: #4d392b;
		color: #ffffff;
		font-size: 13px;
		font-weight: 900;

		&::after {
			border: none;
		}
	}

	.loading,
	.no-more {
		padding: 18px;
		text-align: center;
		font-size: 13px;
		line-height: 20px;
		color: #7d6a5c;
	}

</style>
