<template>
	<view class="circle-detail">
		<!-- 顶部导航栏 -->
		<view class="nav-header">
			<view class="left-btn" @click="goBack">返回</view>
			<text class="header-title">{{ circle.circleName || '圈子详情' }}</text>
			<view class="user-icon" @click="navigateToUser">
				<image class="avatar" :src="ownerAvatar" mode="aspectFill"></image>
			</view>
		</view>

		<!-- 圈子信息 -->
		<view class="circle-info">
			<view class="circle-header">
				<view class="hero-copy">
					<text class="creator-text">{{ headerEyebrow }}</text>
					<text class="hero-title">{{ circle.circleName || '这是一场认真聊天的小局' }}</text>
					<text class="hero-subtitle">{{ headerSubtitle }}</text>
					<view class="decision-points">
						<text class="decision-pill">{{ isFull ? '人数已满' : `还剩 ${remainingSpots} 席` }}</text>
						<text class="decision-pill">{{ isParticipant || isOwner ? '现在就能留言' : '加入后可以留言' }}</text>
						<text class="decision-pill">{{ isActivityStarted ? '已经开局' : '先聊再决定见面' }}</text>
					</view>
				</view>
				<text class="action-note">{{ actionNote }}</text>
			</view>

			<view class="activity-card">
				<view class="section-head">
					<text class="section-title">这局信息</text>
					<text class="section-subtitle">先看看主题、时间和参加门槛</text>
				</view>
				<view class="activity-info">
					<view class="info-item">
						<view class="info-icon">
							<uni-icons type="wallet-filled" size="15" color="#7b5f48"></uni-icons>
						</view>
						<text class="info-text">{{ formatBudget(circle.budget || circle.money) }}</text>
					</view>
					<view class="info-item">
						<view class="info-icon">
							<uni-icons type="staff-filled" size="15" color="#7b5f48"></uni-icons>
						</view>
						<text class="info-text">{{ circle.topic }}</text>
					</view>
					<view class="info-item">
						<view class="info-icon">
							<uni-icons type="calendar-filled" size="15" color="#7b5f48"></uni-icons>
						</view>
						<text class="info-text">{{ circle.slogan }}</text>
					</view>
				</view>
				<view class="activity-time">
					<text class="time-text">{{ formatActivityTime(circle.activityTime) }}</text>
				</view>
				<view class="activity-location">
					<text class="location-text">{{ circle.activityLocation }}</text>
					<text class="location-tip">加入后会看到更完整的位置说明</text>
				</view>
			</view>

			<view class="circle-desc">
				<view class="desc-box">
					<view class="section-head">
						<text class="section-title">为什么值得来</text>
					</view>
					<text class="desc-content">{{ displayDescription }}</text>
				</view>
			</view>
		</view>

		<view class="members-section" v-if="memberList.length">
			<view class="section-head">
				<text class="section-title">这局都有谁</text>
				<text class="section-subtitle">{{ memberSummary }}</text>
			</view>
			<view class="members-list">
				<view class="member-item" v-for="member in memberList" :key="member.userId">
					<image :src="getAvatar(member)" class="member-avatar" mode="aspectFill"></image>
					<view class="member-info">
						<view class="member-header">
							<text class="member-name">{{ member.userName }}</text>
							<text class="member-tag" v-if="isOwnerMember(member)">圈主</text>
						</view>
						<view class="member-content">
								<text class="member-content-text">{{ memberBasicText(member) || '还没有补充更多介绍' }}</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<view class="comments-section">
			<view class="section-header">
				<view class="section-head">
					<text class="section-title">留言区</text>
					<text class="section-subtitle">先看看大家在聊什么，再决定要不要加入</text>
				</view>
			</view>
			
			<view class="comment-input-bar" v-if="canComment" @click="showCommentModal">
				<view class="input-placeholder">
					<text class="placeholder-text">{{ isOwner ? '和报名的人打个招呼' : '留一句话，让大家先认识你' }}</text>
				</view>
			</view>

			<view class="comment-guard" v-else>
				<text class="guard-text">现在先开放围观留言区，你可以先看看聊天氛围，加入后再参与发言。</text>
			</view>

			<view class="comments-list">
				<view class="comment-item" v-for="comment in getComments()" :key="comment.messageId">
					<image :src="getCommentAvatar(comment)" class="comment-avatar" mode="aspectFill"></image>
					<view class="comment-content">
						<view class="comment-header">
							<text class="comment-name">{{ comment.userName }}</text>
							<text class="comment-tag" v-if="isOwnerComment(comment)">圈主</text>
						</view>
						<text class="comment-text">{{ comment.content }}</text>
						<view class="comment-footer">
							<text class="comment-time">{{ comment.createTime }}</text>
							<view class="comment-actions" v-if="canEditComment(comment) || canDeleteComment(comment)">
								<text class="action-text" v-if="canEditComment(comment)" @click="editComment(comment)">编辑</text>
								<text class="action-text" v-if="canDeleteComment(comment)" @click="deleteComment(comment)">删除</text>
							</view>
						</view>
					</view>
				</view>
				<!-- 空状态 -->
				<view v-if="getComments().length === 0" class="empty-comments">
					<text class="empty-text">还没有人留言，等第一句开场白出现。</text>
				</view>
			</view>
		</view>

		<!-- 评论编辑弹框 -->
		<uni-popup ref="commentPopup" type="bottom">
			<view class="comment-modal">
				<view class="modal-header">
					<text class="modal-title">{{ editingComment ? '编辑留言' : '发表留言' }}</text>
					<text class="close-btn" @click="hideCommentModal">×</text>
				</view>
				<view class="modal-content">
					<textarea 
						class="comment-input" 
						v-model="commentContent" 
						placeholder="写一句你想让大家先知道的话"
						maxlength="500"
					></textarea>
					<view class="modal-actions">
						<button class="cancel-btn" @click="hideCommentModal">取消</button>
						<button class="submit-btn" @click="submitComment">确定</button>
					</view>
				</view>
			</view>
		</uni-popup>

		<view class="bottom-action-bar">
			<button class="action-btn bottom-action-btn"
				:class="{ 'edit-btn': isOwner, 'join-btn': !isOwner, 'joined': isParticipant, 'disabled': isActionDisabled }"
				@click="handleAction"
				:disabled="isActionDisabled">
				{{ buttonText }}
			</button>
		</view>
	</view>
</template>

<script>
	import {
		circleApi
	} from '@/request/api'
	import { useUserStore } from '@/store/user'
	import { normalizeImageForDisplay, pad2, toSubmittableImageBase64 } from '@/utils/image'

	export default {
		setup() {
			const userStore = useUserStore()
			return {
				userStore
			}
		},
		data() {
			return {
				options:{},
				userId: '',
				circle: {
					circleId: '',
					circleName: '',
					ownerId: '',
					ownerName: '',
					topic: '',
					slogan: '',
					introduction: '',
					activityTime: '',
					activityLocation: '',
					distance: '',
					latitude: '',
					longitude: '',
					budget: '',
					money: '',
					maxMembers: 6,
					joinStatus: 0,
					circleUserItemList: []
				},
				longitude: '',
				latitude: '',
				commentContent: '',
				editingComment: null
			}
		},

		computed: {
			isOwner() {
				if (!this.userId) return false
				return String(this.circle.ownerId || '') === String(this.userId || '')
			},
			isParticipant() {
				return Number(this.circle.joinStatus) === 1
			},
			isActivityStarted() {
				if (!this.circle.activityTime) return false
				const activityTime = this.parseCircleDate(this.circle.activityTime)
				if (!activityTime) return false
				return activityTime < new Date()
			},
			isFull() {
				return this.memberList.length >= Number(this.circle.maxMembers || 6)
			},
			remainingSpots() {
				const currentMembers = this.memberList.length || 0
				return Math.max(0, Number(this.circle.maxMembers || 6) - currentMembers)
			},
			buttonText() {
				if (this.isOwner) return '编辑这局'
				if (this.isActivityStarted) return '活动已开始'
				if (this.isParticipant) return '退出这局'
				if (this.isFull) return '人数已满'
				return '加入这局'
			},
			isActionDisabled() {
				if (this.isOwner) return false
				if (this.isActivityStarted) return true
				return this.isFull && !this.isParticipant
			},
			ownerInfo() {
				for (let index = 0; index < this.memberList.length; index += 1) {
					const member = this.memberList[index]
					if (member && Number(member.ownerFlag) === 1) return member
				}
				return null
			},
			ownerAvatar() {
				const image = (this.ownerInfo && this.ownerInfo.image) || this.circle.ownerImage
				return normalizeImageForDisplay(image, '/static/default-avatar.png')
			},
			memberList() {
				const list = this.circle.circleUserItemList || this.circle.userList || this.circle.members || []
				return Array.isArray(list) ? list : []
			},
			canComment() {
				return this.isParticipant || this.isOwner
			},
			headerEyebrow() {
				return this.isOwner ? '你发起的小局' : `${this.circle.ownerName || '有人'} · 发起的小局`
			},
			headerSubtitle() {
				if (this.isActivityStarted) {
					return '这场活动已经开始了，可以看看还有哪些人参与。'
				}
				if (this.isOwner) {
					return '你可以继续完善信息、管理成员，也可以在留言区提前暖场。'
				}
				if (this.isParticipant) {
					return '你已经在这局里了，现在可以在留言区继续互动。'
				}
				return '先看看主题、时间和成员，再决定要不要加入。'
			},
			displayDescription() {
				return this.circle.introduction || this.circle.slogan || '这局还没有写很长的介绍，但你可以先从主题、时间和参与成员判断是不是适合自己。'
			},
			memberSummary() {
				const maxMembers = Number(this.circle.maxMembers || 6)
				return `现在有 ${this.memberList.length} / ${maxMembers} 位成员`
			},
			actionNote() {
				if (this.isActivityStarted) {
					return '这场活动已经开始，先看看成员和留言区还留下了什么。'
				}
				if (this.isOwner) {
					return '继续补充时间、地点和介绍，会更容易让想来的人下决定。'
				}
				if (this.isParticipant) {
					return '你已经在这局里了，现在可以去留言区确认时间、问问题。'
				}
				if (this.isFull) {
					return '这局已经满员了，先看看其他正在组的局，或者自己发起一场。'
				}
				return '加入后就能在留言区先打个招呼，确认时间和细节。'
			}
		},

		async onLoad(options) {
			this.options = options
			await this.loadCurrentPage(options)
		},

		// 微信分享给朋友
		onShareAppMessage() {
			return {
				title: `${this.circle.circleName} - ${this.circle.ownerName}发起的圈子`,
				path: `/pages/circle/detail?circleId=${this.circle.circleId}`,
				imageUrl: '/static/share-cover.png'
			}
		},

		// 微信分享到朋友圈
		onShareTimeline() {
			return {
				title: `${this.circle.circleName} - ${this.circle.ownerName}发起的圈子`,
				imageUrl: '/static/share-cover.png'
			}
		},
		// async onShow(options){
		// 	await this.loadCurrentPage(options)
		// },

		methods: {
			memberBasicText(member){
				let result = ""
				const { age, company, school } = member
				if (age){
					result += age + "，"
				}
				if (company){
					result += company + "，"
				}
				if (school){
					result += school
				}
				return result
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
				const date = new Date(String(value).replace(/-/g, '/').replace('T', ' '))
				return isNaN(date.getTime()) ? null : date
			},
			async loadCurrentPage(options){
				// #ifdef MP-WEIXIN
				if (uni.getSystemInfoSync().platform === 'devtools') {
					console.log('模拟器环境，使用默认位置信息')
					this.longitude = 116.24145697699653
					this.latitude = 39.93208468967014
					await this.loadCircleDetail(options, this.longitude, this.latitude)
					return
				}
				// #endif
				
				uni.getLocation({
					type: 'gcj02',
					success: async ({
						longitude,
						latitude
					}) => {
						this.longitude = longitude
						this.latitude = latitude
						await this.loadCircleDetail(options, longitude, latitude)
					},
					fail: (err) => {
						console.error('获取位置失败：', err)
						this.longitude = 116.24145697699653
						this.latitude = 39.93208468967014
						this.loadCircleDetail(options, this.longitude, this.latitude)
					}
				})
			},
			getAvatar(item) {
				return normalizeImageForDisplay(item.image, '/static/default-avatar.png')
			},
			getCommentAvatar(comment) {
				return normalizeImageForDisplay(comment && comment.userImage, '/static/default-avatar.png')
			},
			getMockComments() {
				const seatLimit = Math.max(0, Number(this.remainingSpots || 0))
				if (seatLimit <= 0) return []

				const profilePool = this.memberList
					.filter(member => member && String(member.userId || '') !== String(this.circle.ownerId || ''))
					.map(member => ({
						userId: member.userId,
						userName: member.userName,
						userImage: member.image || ''
					}))
				const fallbackPool = [
					{ userId: 'mock-user-1', userName: 'Mia', userImage: '' },
					{ userId: 'mock-user-2', userName: '阿泽', userImage: '' },
					{ userId: 'mock-user-3', userName: 'Luna', userImage: '' }
				]
				const activeProfiles = (profilePool.length ? profilePool : fallbackPool).slice(0, Math.min(seatLimit, Math.max(profilePool.length, fallbackPool.length)))
				if (activeProfiles.length === 0) return []

				const topic = this.circle.topic || this.circle.circleName || '这个局'
				const location = this.circle.activityLocation || '市中心附近'
				const activityTime = this.formatActivityTime(this.circle.activityTime)
				const lines = [
					`我对 ${topic} 这条线挺感兴趣的，如果最后真能聊到线下见面就更好了。`,
					`我也想来，时间看着还可以。地点如果定在 ${location} 一带，我下班过去不会太赶。`,
					`我比较想知道大家会从什么角度聊，偏分享经历还是偏交换信息？`,
					`我更希望气氛轻一点，别像硬社交局。先在线上熟一熟，再约 ${activityTime} 见面我能接受。`,
					`如果这局最后确定成行，我可以提前做一点资料或者路线功课，见面时会更好聊。`
				]

				const speakerOrderByCount = {
					1: [0, 0, 0],
					2: [0, 1, 0, 1],
					3: [0, 1, 2, 0, 1]
				}
				const speakerOrder = speakerOrderByCount[activeProfiles.length] || [0, 1, 2, 3, 0]
				const timeList = ['今天 19:12', '今天 19:18', '今天 19:24', '今天 19:31', '今天 19:37']

				return speakerOrder.map((speakerIndex, index) => {
					const profile = activeProfiles[speakerIndex]
					return {
						messageId: `mock-comment-${index + 1}`,
						userId: profile.userId,
						userName: profile.userName,
						userImage: profile.userImage || '',
						content: lines[index],
						createTime: timeList[index] || `今天 19:${12 + index * 6}`,
						status: 1,
						isMock: true
					}
				})
			},
			isOwnerMember(member) {
				return Number(member && member.ownerFlag) === 1
			},
			isOwnerComment(comment) {
				return String((comment && comment.userId) || '') === String(this.circle.ownerId || '')
			},
			goBack() {
				const pages = getCurrentPages()
				if (pages.length > 1) {
					uni.navigateBack()
					return
				}
				uni.switchTab({
					url: '/pages/circle/circle'
				})
			},
			navigateToUser() {
				const ownerId = this.circle.ownerId || (this.ownerInfo && this.ownerInfo.userId)
				if (!ownerId) {
					uni.showToast({
						title: '暂时还找不到这位发起人',
						icon: 'none'
					})
					return
				}
				uni.navigateTo({
					url: `/pages/profile/profileDetail?userId=${ownerId}`
				})
			},
			
			async loadCircleDetail(options, longitude, latitude){
				this.userId = await this.userStore.getUserId()
				if (options && options.circleId) {
					// 先用路由参数设置基本信息
					this.circle = {
						...this.circle,
						circleId: options.circleId,
					}
				
					// 获取详细信息 
					try {
						const res = await circleApi.getCircleDetail(options.circleId, this.userId, longitude, latitude)
						if (res.status === 10000 && res.data) {
							this.circle = {
								...this.circle,
								...res.data,
								circleUserItemList: res.data.circleUserItemList || res.data.userList || res.data.members || []
							}
						} else {
							throw new Error(res.message || res.msg || '获取圈子详情失败')
						}
					} catch (error) {
						console.error('获取圈子详情失败:', error)
						uni.showToast({
							title: '这局的信息暂时没加载出来',
							icon: 'none'
						})
					}
				}
			},
			
			async handleAction() {
				if (this.isOwner) {
					this.navigateToEdit()
				} else {
					this.handleJoin()
				}
			},
			navigateToEdit() {
				uni.navigateTo({
					url: `/pages/circle/create?circleId=${this.circle.circleId}`
				})
			},
			async handleJoin() {
				const isLoggedIn = await this.userStore.checkLoginStatus()
				if (!isLoggedIn) return

				if (!this.validateJoinProfile()) {
					return
				}

				const userId = await this.userStore.getUserId()
				const originalJoinStatus = this.circle.joinStatus
				const nextJoinStatus = Number(originalJoinStatus) === 0 ? 1 : 0
				const successTitle = nextJoinStatus === 1 ? '你已经加入这局了' : '你已经退出这局了'
				const fallbackError = nextJoinStatus === 1 ? '这次还没加入成功' : '这次还没退出成功'

				try {
					this.circle.joinStatus = nextJoinStatus
					const res = await circleApi.bindCirCle({
						circleId: this.circle.circleId,
						userId,
						status: nextJoinStatus
					})
					if (res.status !== 10000) {
						throw new Error(this.getResponseMessage(res, fallbackError))
					}
					uni.showToast({
						title: successTitle,
						icon: nextJoinStatus === 1 ? 'success' : 'none'
					})
					await this.loadCurrentPage(this.options)
				} catch (error) {
					this.circle.joinStatus = originalJoinStatus
					console.error('更新圈子加入状态失败:', error)
					uni.showToast({
						title: error.message || fallbackError,
						icon: 'none'
					})
				}
			},

			getResponseMessage(res, fallback) {
				if (!res) return fallback
				const data = res.data || {}
				return res.message || res.msg || data.message || data.msg || fallback
			},
			// 预览图片
			previewImage(index) {
				uni.previewImage({
					current: index,
					urls: this.circle.images
				})
			},

			// 格式化预算
			formatBudget(budget) {
				if (budget === undefined || budget === null || budget === '' || Number(budget) === 0) return '免费'
				return `${budget} 元/人`
			},

			// 格式化活动时间
			formatActivityTime(time) {
				if (!time) return '时间待定'
				const date = this.parseCircleDate(time)
				if (!date) return '时间待定'
				const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
				const weekday = weekdays[date.getDay()]
				const month = pad2(date.getMonth() + 1)
				const day = pad2(date.getDate())
				const hours = pad2(date.getHours())
				const minutes = pad2(date.getMinutes())
				return `${date.getFullYear()}.${month}.${day} ${weekday} ${hours}:${minutes}`
			},


			// 显示评论弹框
			async showCommentModal() {
				try {
					// 显示加载提示
					uni.showLoading({
						title: '正在准备留言...'
					})
					
					// 在显示弹框前确保用户信息完整
					await this.userStore.ensureUserInfo()
					
					uni.hideLoading()
					this.commentContent = ''
					this.editingComment = null
					this.$refs.commentPopup.open()
				} catch (error) {
					uni.hideLoading()
					console.error('获取用户信息失败:', error)
					uni.showToast({
						title: '你的资料暂时没准备好',
						icon: 'none'
					})
				}
			},

			// 隐藏评论弹框
			hideCommentModal() {
				this.$refs.commentPopup.close()
				this.commentContent = ''
				this.editingComment = null
			},

			// 编辑评论
			async editComment(comment) {
				try {
					// 显示加载提示
					uni.showLoading({
						title: '正在准备留言...'
					})
					
					// 在显示弹框前确保用户信息完整
					await this.userStore.ensureUserInfo()
					
					uni.hideLoading()
					this.editingComment = comment
					this.commentContent = comment.content
					this.$refs.commentPopup.open()
				} catch (error) {
					uni.hideLoading()
					console.error('获取用户信息失败:', error)
					uni.showToast({
						title: '你的资料暂时没准备好',
						icon: 'none'
					})
				}
			},

						// 删除评论
			async deleteComment(comment) {
				uni.showModal({
					title: '删掉这条留言？',
					content: '删掉后就不能恢复了。',
					success: async (res) => {
						if (res.confirm) {
							try {
								// 确保用户信息完整
								await this.userStore.ensureUserInfo()
								
								// 验证用户信息完整性
								if (!this.validateUserInfo()) {
									return
								}
								
								// 显示删除中提示
								uni.showLoading({ title: '正在删除...' })
								
								const commentData = this.buildCommentData('delete', comment.messageId)
								const res = await circleApi.updateCircleMessage(commentData)
								if (res.status === 10000) {
									uni.hideLoading()
									uni.showLoading({ title: '正在刷新...' })
									const refreshSuccess = await this.refreshCircleDetail()
									uni.hideLoading()
									if (refreshSuccess) {
										uni.showToast({ title: '这条留言已经删掉了', icon: 'success' })
									}
								} else {
									throw new Error(res.message || res.msg || '这条留言还没删掉')
								}
								} catch (error) {
									uni.hideLoading()
									console.error('删除评论失败:', error)
									uni.showToast({ title: error.message || '这条留言还没删掉', icon: 'none' })
								}
						}
					}
				})
			},

			// 验证用户信息完整性
			validateUserInfo() {
				const userInfo = this.userStore.userInfo
				if (!userInfo.userName) {
					uni.showToast({ title: '先补一个昵称，再来留言', icon: 'none' })
					return false
				}
				if (!toSubmittableImageBase64(userInfo.image)) {
					uni.showToast({ title: '头像需要重新选一次，才能继续留言', icon: 'none' })
					setTimeout(() => {
						uni.navigateTo({
							url: '/pages/profile/profileNew'
						})
					}, 900)
					return false
				}
				return true
			},

			validateJoinProfile() {
				const userInfo = this.userStore.userInfo || {}
				if (!String(userInfo.userName || '').trim() || !String(userInfo.image || '').trim()) {
					uni.showToast({
						title: '先补昵称和头像，再加入这局',
						icon: 'none'
					})
					setTimeout(() => {
						uni.navigateTo({
							url: '/pages/profile/profileNew'
						})
					}, 900)
					return false
				}
				return true
			},

			// 构建评论数据
			buildCommentData(operation = 'create', messageId = null) {
				const baseData = {
					circleId: this.circle.circleId,
					content: this.commentContent,
					userId: this.userId,
					userName: this.userStore.userInfo.userName,
					userImage: toSubmittableImageBase64(this.userStore.userInfo.image),
					status: 1 // 默认生效状态
				}
				
				if (operation === 'edit' && messageId) {
					baseData.messageId = messageId
				} else if (operation === 'delete' && messageId) {
					baseData.messageId = messageId
					baseData.status = 0 // 删除状态
				}
				
				return baseData
			},

			// 提交评论
			async submitComment() {
				if (!this.commentContent.trim()) {
					uni.showToast({ title: '先写一句想说的话', icon: 'none' })
					return
				}

				try {
					// 确保用户信息完整
					await this.userStore.ensureUserInfo()
					
					// 验证用户信息完整性
					if (!this.validateUserInfo()) {
						return
					}
					
					// 显示提交中提示
					uni.showLoading({ title: this.editingComment ? '正在保存...' : '正在发表...' })
					
					if (this.editingComment) {
						// 编辑评论
						const commentData = this.buildCommentData('edit', this.editingComment.messageId)
						const res = await circleApi.updateCircleMessage(commentData)
						if (res.status === 10000) {
							uni.hideLoading()
							uni.showLoading({ title: '正在刷新...' })
							const refreshSuccess = await this.refreshCircleDetail()
							uni.hideLoading()
							if (refreshSuccess) {
								uni.showToast({ title: '留言已经改好了', icon: 'success' })
							}
						} else {
							throw new Error(res.message || res.msg || '这条留言还没改好')
						}
					} else {
						// 新增评论
						const commentData = this.buildCommentData('create')
						const res = await circleApi.updateCircleMessage(commentData)
						if (res.status === 10000) {
							uni.hideLoading()
							uni.showLoading({ title: '正在刷新...' })
							const refreshSuccess = await this.refreshCircleDetail()
							uni.hideLoading()
							if (refreshSuccess) {
								uni.showToast({ title: '留言已经发出去了', icon: 'success' })
							}
						} else {
							throw new Error(res.message || res.msg || '这条留言还没发出去')
						}
					}
					this.hideCommentModal()
					} catch (error) {
						uni.hideLoading()
						console.error('提交评论失败:', error)
						uni.showToast({ title: error.message || '这次操作还没成功', icon: 'none' })
					}
			},

								// 获取评论列表（从圈子详情数据中获取）
			getComments() {
				// 优先使用 circleMessageItemList 字段
				let messageList = this.circle.circleMessageItemList || this.circle.messages || []
				
				if (Array.isArray(messageList)) {
					// 过滤掉已删除的留言（如果有status字段），并按时间排序
					const filteredComments = messageList
						.filter(comment => {
							// 如果没有status字段，默认显示；如果有status字段且为1，则显示
							return !comment.hasOwnProperty('status') || comment.status === 1
						})
						.sort((a, b) => new Date(a.createTime) - new Date(b.createTime))
					if (filteredComments.length > 0) {
						return filteredComments
					}
				}
				return this.getMockComments()
			},

			// 检查是否可以管理评论
			canManageComment(comment) {
				return this.isOwner || (this.isParticipant && String(comment.userId || '') === String(this.userId || ''))
			},

			// 检查是否可以编辑评论（只能编辑自己的评论）
			canEditComment(comment) {
				if (comment && comment.isMock) return false
				return String(comment.userId || '') === String(this.userId || '')
			},

			// 检查是否可以删除评论（圈主可以删除任何评论，参与者只能删除自己的评论）
			canDeleteComment(comment) {
				if (comment && comment.isMock) return false
				return this.isOwner || String(comment.userId || '') === String(this.userId || '')
			},

			// 刷新圈子详情
			async refreshCircleDetail() {
				try {
					await this.loadCurrentPage(this.options)
					return true
				} catch (error) {
					console.error('刷新圈子详情失败:', error)
					uni.showToast({
						title: '页面还没刷新出来',
						icon: 'none'
					})
					return false
				}
			},


		}
	}
</script>

<style lang="scss" scoped>
	.circle-detail {
		min-height: 100vh;
		padding-bottom: 112px;
		background:
			radial-gradient(circle at top left, rgba(255, 255, 255, 0.95), transparent 34%),
			radial-gradient(circle at bottom right, rgba(216, 194, 174, 0.68), transparent 34%),
			linear-gradient(160deg, #f7f3ee 0%, #efe4d8 48%, #e6d7c8 100%) !important;
		color: #30261f;
		box-sizing: border-box;
	}

	.circle-detail .nav-header {
		position: sticky;
		top: 0;
		z-index: 10;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: calc(var(--status-bar-height) + 10px) 16px 12px;
		border-bottom: 1px solid rgba(82, 49, 31, 0.1);
		background: rgba(255, 250, 245, 0.88) !important;
		color: #30261f !important;
		backdrop-filter: blur(18px);
	}

	.circle-detail .left-btn {
		min-width: 52px;
		height: 30px;
		line-height: 30px;
		padding: 0 10px;
		border: 1px solid rgba(111, 61, 29, 0.1);
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.72);
		box-shadow: 0 4px 12px rgba(111, 61, 29, 0.05);
		color: #7b5f48;
		font-size: 12px !important;
		font-weight: 700;
		text-align: center;
	}

	.circle-detail .header-title {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		color: #30261f !important;
		font-size: 17px !important;
		font-weight: 800 !important;
		line-height: 30px;
		text-align: center;
		letter-spacing: -0.2px;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.circle-detail .user-icon {
		display: flex;
		width: 52px;
		height: 30px;
		align-items: center;
		justify-content: flex-end;
	}

	.circle-detail .user-icon .avatar {
		width: 30px !important;
		height: 30px !important;
		border-radius: 11px !important;
		background: #efe3d8;
		box-shadow: 0 4px 12px rgba(111, 84, 63, 0.08);
	}

	.circle-detail .circle-info {
		padding: 20px 20px 0 !important;
	}

	.circle-detail .circle-header {
		display: block;
		margin-bottom: 18px !important;
	}

	.circle-detail .hero-copy {
		flex: 1;
		min-width: 0;
	}

	.circle-detail .creator-text {
		display: block;
		color: #7b5f48 !important;
		font-size: 12px !important;
		font-weight: 800;
		letter-spacing: 0.5px;
		line-height: 18px;
	}

	.circle-detail .hero-title {
		display: block;
		margin-top: 8px;
		color: #30261f !important;
		font-size: 24px !important;
		font-weight: 900 !important;
		line-height: 32px;
		letter-spacing: -0.4px;
	}

	.circle-detail .hero-subtitle {
		display: block;
		margin-top: 10px;
		color: #7d6a5c !important;
		font-size: 14px !important;
		line-height: 22px;
	}

	.circle-detail .decision-points {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 16px;
	}

	.circle-detail .decision-pill {
		min-height: 28px;
		padding: 0 10px;
		border-radius: 999px;
		background: rgba(140, 102, 76, 0.1);
		color: #7b5f48;
		font-size: 12px;
		font-weight: 800;
		line-height: 28px;
	}

	.circle-detail .action-btn {
		display: block;
		width: 100% !important;
		height: 54px !important;
		line-height: 54px !important;
		margin: 0 !important;
		padding: 0 20px !important;
		border: 0 !important;
		border-radius: 20px !important;
		background: linear-gradient(135deg, #8c664c 0%, #72513b 100%) !important;
		box-shadow: 0 14px 26px rgba(94, 70, 52, 0.22);
		color: #ffffff !important;
		font-size: 16px !important;
		font-weight: 900;
		text-align: center;
	}

	.circle-detail .action-btn::after,
	.circle-detail .cancel-btn::after,
	.circle-detail .submit-btn::after {
		border: none;
	}

	.circle-detail .action-btn.joined,
	.circle-detail .action-btn.disabled {
		border: 1px solid rgba(82, 49, 31, 0.1) !important;
		background: #efe7df !important;
		box-shadow: none;
		color: #ad9d90 !important;
	}

	.circle-detail .action-note {
		display: block;
		margin-top: 14px;
		color: #7d6a5c;
		font-size: 13px;
		line-height: 20px;
	}

	.circle-detail .bottom-action-bar {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 20;
		padding: 12px 20px calc(env(safe-area-inset-bottom) + 14px);
		background: linear-gradient(180deg, rgba(247, 243, 238, 0) 0%, rgba(247, 243, 238, 0.86) 22%, rgba(247, 243, 238, 0.96) 100%);
		backdrop-filter: blur(10px);
		box-sizing: border-box;
	}

	.circle-detail .bottom-action-btn {
		max-width: 100%;
	}

	.circle-detail .activity-card,
	.circle-detail .circle-desc .desc-box,
	.circle-detail .members-section,
	.circle-detail .comments-section {
		border: 1px solid rgba(82, 49, 31, 0.12);
		border-radius: 22px;
		background: #fffaf5 !important;
		box-shadow: 0 10px 24px rgba(103, 77, 58, 0.06);
	}

	.circle-detail .activity-card {
		margin: 0 0 20px !important;
		padding: 20px !important;
	}

	.circle-detail .section-head {
		margin-bottom: 14px;
	}

	.circle-detail .section-title {
		display: block;
		color: #30261f !important;
		font-size: 18px !important;
		font-weight: 900 !important;
		line-height: 26px;
		letter-spacing: -0.2px;
	}

	.circle-detail .section-subtitle {
		display: block;
		margin-top: 4px;
		color: #7d6a5c !important;
		font-size: 13px !important;
		line-height: 20px;
	}

	.circle-detail .activity-info {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		justify-content: flex-start !important;
		margin-bottom: 16px !important;
	}

	.circle-detail .info-item {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		max-width: 100%;
		min-height: 36px;
		padding: 8px 12px;
		border-radius: 999px;
		background: #f1e4d8;
		color: #7b5f48;
	}

	.circle-detail .info-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 15px;
		height: 15px;
		flex-shrink: 0;
	}

	.circle-detail .info-text {
		font-size: 13px !important;
		font-weight: 800;
		line-height: 20px;
		color: #7b5f48 !important;
	}

	.circle-detail .activity-time,
	.circle-detail .activity-location {
		margin-top: 14px;
	}

	.circle-detail .time-text,
	.circle-detail .location-text {
		color: #30261f !important;
		font-size: 15px !important;
		font-weight: 700;
		line-height: 24px;
	}

	.circle-detail .location-tip {
		display: block;
		margin-top: 6px;
		color: #7d6a5c !important;
		font-size: 13px !important;
		line-height: 20px;
	}

	.circle-detail .circle-desc {
		margin-bottom: 0 !important;
	}

	.circle-detail .desc-box {
		padding: 20px !important;
	}

	.circle-detail .desc-content,
	.circle-detail .member-content-text,
	.circle-detail .comment-text {
		color: #7d6a5c !important;
		font-size: 15px !important;
		line-height: 24px !important;
	}

	.circle-detail .members-section,
	.circle-detail .comments-section {
		margin: 20px 20px 0 !important;
		padding: 20px !important;
		border-top: 1px solid rgba(82, 49, 31, 0.12) !important;
	}

	.circle-detail .section-header {
		margin-bottom: 14px;
	}

	.circle-detail .member-item,
	.circle-detail .comment-item {
		display: flex;
		align-items: flex-start;
		margin-bottom: 0 !important;
		padding: 18px 0;
		border-bottom: 1px solid rgba(82, 49, 31, 0.08);
	}

	.circle-detail .member-item:last-child,
	.circle-detail .comment-item:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.circle-detail .member-avatar,
	.circle-detail .comment-avatar {
		width: 44px !important;
		height: 44px !important;
		margin-right: 12px !important;
		border-radius: 14px !important;
		background: #efe3d8;
		box-shadow: 0 8px 18px rgba(111, 84, 63, 0.1);
	}

	.circle-detail .member-info,
	.circle-detail .comment-content {
		flex: 1;
		min-width: 0;
	}

	.circle-detail .member-header,
	.circle-detail .comment-header,
	.circle-detail .comment-footer,
	.circle-detail .comment-actions {
		display: flex;
		align-items: center;
	}

	.circle-detail .member-header,
	.circle-detail .comment-header {
		gap: 8px;
	}

	.circle-detail .member-name,
	.circle-detail .comment-name {
		color: #30261f !important;
		font-size: 15px !important;
		font-weight: 900 !important;
		line-height: 24px;
	}

	.circle-detail .member-tag,
	.circle-detail .comment-tag {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 22px;
		padding: 0 8px !important;
		border-radius: 999px !important;
		background: #f1e4d8 !important;
		color: #7b5f48 !important;
		font-size: 11px !important;
		font-weight: 900;
		line-height: 22px;
		text-align: center;
		flex-shrink: 0;
	}

	.circle-detail .comment-input-bar {
		margin-bottom: 10px !important;
		padding: 14px 16px !important;
		border: 1px solid rgba(82, 49, 31, 0.12) !important;
		border-radius: 18px !important;
		background: #ffffff !important;
		box-shadow: none !important;
	}

	.circle-detail .comment-guard {
		margin-bottom: 10px;
		padding: 12px 14px;
		border-radius: 18px;
		background: rgba(140, 102, 76, 0.08);
	}

	.circle-detail .guard-text {
		color: #7b5f48;
		font-size: 13px;
		line-height: 20px;
	}

	.circle-detail .comment-input-bar:active {
		border-color: rgba(140, 102, 76, 0.28) !important;
		background: #fff8f1 !important;
	}

	.circle-detail .placeholder-text,
	.circle-detail .comment-time,
	.circle-detail .action-text,
	.circle-detail .empty-text {
		color: #7d6a5c !important;
	}

	.circle-detail .placeholder-text,
	.circle-detail .empty-text {
		font-size: 14px !important;
		line-height: 22px;
	}

	.circle-detail .comment-time,
	.circle-detail .action-text {
		font-size: 12px !important;
		line-height: 18px;
	}

	.circle-detail .comment-footer {
		justify-content: space-between;
		gap: 12px;
		margin-top: 10px;
	}

	.circle-detail .comment-actions {
		gap: 12px;
		flex-shrink: 0;
	}

	.circle-detail .comment-modal {
		padding: 20px !important;
		border-radius: 24px 24px 0 0 !important;
		background: #fffaf5 !important;
	}

	.circle-detail .modal-title {
		color: #30261f !important;
		font-size: 17px !important;
		font-weight: 900 !important;
		line-height: 24px;
	}

	.circle-detail .comment-input {
		width: 100%;
		min-height: 136px !important;
		padding: 14px !important;
		border: 1px solid rgba(82, 49, 31, 0.12) !important;
		border-radius: 18px !important;
		background: #ffffff !important;
		color: #30261f;
		font-size: 15px !important;
		line-height: 24px;
	}

	.circle-detail .cancel-btn,
	.circle-detail .submit-btn {
		height: 48px !important;
		line-height: 48px !important;
		border: 0 !important;
		border-radius: 18px !important;
		font-size: 15px !important;
		font-weight: 900;
	}

	.circle-detail .cancel-btn {
		background: #efe7df !important;
		color: #7b5f48 !important;
	}

	.circle-detail .submit-btn {
		background: linear-gradient(135deg, #8c664c 0%, #72513b 100%) !important;
		color: #ffffff !important;
	}
</style>
