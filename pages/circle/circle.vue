<template>
	<view class="container">
		<view class="ambient ambient-one"></view>
		<view class="ambient ambient-two"></view>

		<scroll-view class="scroll-view" scroll-y @scrolltolower="loadMore">
			<view class="page-content">

				<view class="hero-card">
					<view class="hero-eyebrow">{{ getListFlag() === 1 ? '我的小局' : (isVisitorMode ? '先逛逛' : '小群友') }}</view>
					<text class="hero-title">{{ getHeroTitle() }}</text>
					<text class="hero-copy">{{ getHeroCopy() }}</text>
					<view class="hero-points">
						<text class="hero-point">{{ getListFlag() === 1 ? '继续留言' : (isVisitorMode ? '先看真实圈子' : '固定 6 人') }}</text>
						<text class="hero-point">{{ getListFlag() === 1 ? '回看安排' : (isVisitorMode ? '合适再登录加入' : '先留言再见面') }}</text>
						<text class="hero-point">{{ getListFlag() === 1 ? '补充细节' : '聊得来再去见朋友' }}</text>
					</view>
				</view>

				<view class="section list-section">
					<view class="section-head">
						<text class="section-title">{{ getListFlag() === 1 ? '我的圈子' : '附近正在组局' }}</text>
						<text class="section-subtitle">{{ getSectionSubtitle() }}</text>
					</view>
					<view class="list">
						<view
							class="group-card"
							:class="{ 'group-card-disabled': isCircleStarted(item) }"
							v-for="(item, index) in circleStore.list"
							:key="item.circleId"
						>
							<view class="group-badge-row">
								<text class="group-seat">{{ getMemberLabel(item) }}</text>
							</view>
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
									<text class="group-title">{{ getCircleTitle(item, index) }}</text>
								</view>
							</view>

							<text class="group-copy">{{ getCircleSummary(item, index) }}</text>
							<view class="group-meta">
								<text class="meta-pill">{{ getDistanceLabel(item) }}</text>
								<text class="meta-pill">{{ formatActivityLabel(item.activityTime || item.createTime) }}</text>
								<text v-if="isCircleStarted(item)" class="meta-pill muted">已开始</text>
							</view>
							<view class="tag-row">
								<text class="tag" v-for="tag in getCircleTags(item)" :key="tag">{{ tag }}</text>
							</view>
							<text class="group-hint">{{ getDecisionHint(item) }}</text>
							<view
								class="group-action"
								:class="{ 'group-action-disabled': isCircleStarted(item) }"
								@click.stop="navigateToDetail(item)"
							>
								<text class="group-action-text">{{ isCircleStarted(item) ? '这局已经开始' : '进去看看这局' }}</text>
								<text class="group-action-arrow">{{ isCircleStarted(item) ? '·' : '→' }}</text>
							</view>
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

		<view class="bottom-cta">
			<button class="button-soft bottom-create-btn" @click="createCircle">{{ getListFlag() === 1 ? '再发起一局' : '我来组一局' }}</button>
		</view>
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

	const EUROPE_CIRCLE_ID = 'bf0208a16f2f74c654597fb5de2eeea8'
	const EUROPE_CIRCLE_NAME = '约人去欧洲'
	const EUROPE_CIRCLE_INTRO = '约几个互联网工作的人一起去欧洲旅游，希望是从事产品和研发相关工作，喜欢户外和旅行的'
	const EUROPE_CIRCLE_COFFEE_SHOP = 'Manner Coffee(西溪亲橙里店)'

	function pickStableCoffeeShop() {
		return EUROPE_CIRCLE_COFFEE_SHOP
	}

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
				isVisitorMode: false,
				currentListParams: null,
				pageOptions: null // 保存页面参数
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

				uni.getLocation({
					type: 'gcj02',
					success: ({
						longitude,
						latitude
					}) => {
						this.loadCircleListWithLocation({ userId, longitude, latitude })
					},
					fail: (err) => {
						console.error('获取位置失败，按非附近排序加载真实圈子列表：', err)
						uni.showToast({
							title: '未获取到定位，先展示真实列表',
							icon: 'none'
						})
						this.loadCircleListWithLocation({
							userId,
							longitude: '',
							latitude: ''
						})
					}
				})
			},

			async requireLoginForList() {
				if (this.getListFlag() === 1) {
					this.isVisitorMode = false
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
				}

				const isLoggedIn = await this.userStore.checkLoginSilently()
				this.isVisitorMode = !isLoggedIn
				if (!isLoggedIn) {
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

			getHeroTitle() {
				if (this.getListFlag() === 1) {
					return '看看你发起和加入的小局'
				}
				if (this.isVisitorMode) {
					return '先看看附近都在聊什么，再决定要不要加入'
				}
				return '和对的人约一杯咖啡，一起聊感兴趣的事'
			},

			getHeroCopy() {
				if (this.getListFlag() === 1) {
					return '这里会收起你正在参与的局，也方便你继续回看、补充和分享。'
				}
				if (this.isVisitorMode) {
					return '列表里展示的都是当前真实在组的局。先看主题、时间和发起人，合适再登录加入。'
				}
				return '最多6人小群，先在线上聊共同兴趣，再找个咖啡店见一面'
			},

			getSectionSubtitle() {
				if (this.getListFlag() === 1) {
					return '回到你已经参与的局'
				}
				if (this.isVisitorMode) {
					return '先看主题、时间和谁发起，再决定要不要加入'
				}
				return '挑一个你想加入的话题'
			},

			getAvatar(item) {
				return normalizeImageForDisplay(item.ownerImage, '/static/default-avatar.png')
			},

			getOwnerName(item) {
				return item.ownerName ? item.ownerName : "某某"
			},

			isEuropeCircle(item = {}) {
				return String(item.circleId || '') === EUROPE_CIRCLE_ID || String(item.circleName || '').trim() === EUROPE_CIRCLE_NAME
			},

			getCircleVenue(item = {}) {
				if (item.activityLocation) return item.activityLocation
				if (this.isEuropeCircle(item)) {
					return pickStableCoffeeShop(item.circleId || item.circleName)
				}
				return ''
			},

			getCircleTitle(item) {
				return item.circleName || '圈子'
			},

			getCircleSummary(item) {
				if (this.isEuropeCircle(item)) {
					return EUROPE_CIRCLE_INTRO
				}
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
				const normalizedCurrent = Math.max(1, Math.min(6, Number(current) || 1))
				return `${normalizedCurrent}/6 人`
			},

			getCircleTags(item) {
				if (this.isEuropeCircle(item)) {
					const venue = this.getCircleVenue(item)
					return venue ? [venue] : []
				}
				const source = [item.topic, item.slogan, this.getCircleVenue(item)].filter(Boolean)
				return source.slice(0, 3)
			},

			getDecisionHint(item) {
				if (this.isEuropeCircle(item)) {
					return '入局后可以先在线上留言沟通，然后在指定的时间地点喝杯咖啡噢'
				}
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
		padding: calc(var(--status-bar-height) + 44px) 20px 120px;
	}

	.hero-card {
		padding: 26px 22px 22px;
		border-radius: 28px;
		background:
			radial-gradient(circle at 18% 18%, rgba(255, 255, 255, 0.24), transparent 20%),
			radial-gradient(circle at top right, rgba(255, 255, 255, 0.34), transparent 30%),
			linear-gradient(145deg, #6f4b39 0%, #9a6d52 46%, #d3a98e 100%);
		box-shadow: 0 22px 44px rgba(111, 84, 63, 0.24);
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

	.button-soft {
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
		height: 54px;
		line-height: 54px;
		margin: 0;
		padding: 0 20px;
	}


	.button-soft {
		background: rgba(255, 250, 245, 0.88);
		border: 1px solid rgba(123, 95, 73, 0.14);
		color: #7c5f49;
	}

	.button-soft:active,
	.group-card:active {
		transform: translateY(-1px);
	}

	.section {
		margin-top: 24px;
	}

	.section-head {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 14px;
		padding: 0 2px;
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
		max-width: 180px;
		font-size: 13px;
		line-height: 20px;
		color: #7d6a5c;
		text-align: right;
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

	.bottom-cta {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 3;
		padding: 12px 20px calc(env(safe-area-inset-bottom) + 14px);
		background: linear-gradient(180deg, rgba(247, 243, 238, 0) 0%, rgba(247, 243, 238, 0.86) 22%, rgba(247, 243, 238, 0.96) 100%);
		backdrop-filter: blur(10px);
	}

	.bottom-create-btn {
		border-radius: 20px;
		background: linear-gradient(135deg, #8c664c 0%, #72513b 100%);
		box-shadow: 0 14px 26px rgba(94, 70, 52, 0.22);
		color: #ffffff;
		font-size: 16px;
	}





	.group-card {
		position: relative;
		padding: 18px 18px 20px;
		overflow: hidden;
		border-radius: 24px;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 248, 241, 0.95));
		box-shadow: 0 14px 30px rgba(103, 77, 58, 0.08);
	}

	.group-card-disabled {
		opacity: 0.62;
	}

	.group-badge-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		margin-bottom: 12px;
	}

	.group-seat {
		display: inline-flex;
		align-items: center;
		min-height: 26px;
		padding: 0 10px;
		border-radius: 999px;
		font-size: 11px;
		font-weight: 900;
		line-height: 26px;
	}

	.group-seat {
		background: rgba(140, 102, 76, 0.1);
		color: #7b5f48;
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

	.group-action {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		margin-top: 16px;
		padding-top: 14px;
		border-top: 1px solid rgba(82, 49, 31, 0.08);
	}

	.group-action-text {
		color: #4f3526;
		font-size: 14px;
		font-weight: 900;
		line-height: 20px;
	}

	.group-action-arrow {
		color: #8c664c;
		font-size: 18px;
		font-weight: 900;
		line-height: 20px;
	}

	.group-action-disabled .group-action-text,
	.group-action-disabled .group-action-arrow {
		color: #ad9d90;
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
