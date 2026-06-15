<template>
	<view class="circle-detail">
		<!-- 顶部导航栏 -->
		<view class="nav-header">
			<view class="left-btn" @click="goBack">返回</view>
			<text class="header-title">{{ circle.circleName }}</text>
			<view class="user-icon" @click="navigateToUser">
				<image class="avatar" :src="ownerAvatar" mode="aspectFill"></image>
			</view>
		</view>

		<!-- 圈子信息 -->
		<view class="circle-info">
			<!-- 创建人和加入按钮 -->
				<view class="circle-header">
					<text class="creator-text">{{ circle.ownerName }}想和大家一起</text>
					<button class="action-btn"
						:class="{ 'edit-btn': isOwner, 'join-btn': !isOwner, 'joined': isParticipant, 'disabled': isActionDisabled }"
						@click="handleAction"
						:disabled="isActionDisabled">
						{{ buttonText }}
					</button>
				</view>

			<!-- 活动详情卡片 -->
			<view class="activity-card">
				<text class="activity-title">{{ circle.circleName }}</text>
				<view class="activity-info">
					<view class="info-item">
						<text class="info-icon">💰</text>
						<text class="info-text">{{ formatBudget(circle.budget || circle.money) }}</text>
					</view>
					<view class="info-item">
						<text class="info-icon">👥</text>
						<text class="info-text">{{ circle.topic }}</text>
					</view>
					<view class="info-item">
						<text class="info-icon">⏰</text>
						<text class="info-text">{{ circle.slogan }}</text>
					</view>
				</view>
				<view class="activity-time">
					<text class="time-text">{{ formatActivityTime(circle.activityTime) }}</text>
				</view>
				<view class="activity-location">
					<text class="location-text">{{ circle.activityLocation }}</text>
					<text class="location-tip">(报名后显示完整信息)</text>
				</view>
			</view>

			<!-- 圈子描述 -->
			<view class="circle-desc">
				<text class="desc-title">圈子描述</text>
				<view class="desc-box">
					<text class="desc-content">{{ circle.introduction }}</text>
				</view>
			</view>
		</view>

		<!-- 成员列表 -->
		<view class="members-section" v-if="memberList.length">
			<view class="section-title">圈子成员</view>
			<view class="members-list">
				<view class="member-item" v-for="member in memberList" :key="member.userId">
					<image :src="getAvatar(member)" class="member-avatar" mode="aspectFill"></image>
					<view class="member-info">
						<view class="member-header">
							<text class="member-name">{{ member.userName }}</text>
							<text class="member-tag" v-if="isOwnerMember(member)">圈主</text>
						</view>
						<view class="member-content">
								<text class="member-content-text">{{memberBasicText(member)}}</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 留言讨论区 -->
		<view class="comments-section">
			<view class="section-header">
				<text class="section-title">留言讨论区</text>
			</view>
			
			<!-- 留言输入框 -->
			<view class="comment-input-bar" v-if="canComment" @click="showCommentModal">
				<view class="input-placeholder">
					<text class="placeholder-text">快发表留言吧</text>
				</view>
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
					<text class="empty-text">暂无留言，快来发表第一条留言吧！</text>
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
						placeholder="请输入留言内容..."
						maxlength="500"
					></textarea>
					<view class="modal-actions">
						<button class="cancel-btn" @click="hideCommentModal">取消</button>
						<button class="submit-btn" @click="submitComment">确定</button>
					</view>
				</view>
			</view>
		</uni-popup>
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
				if (this.isOwner) return '编辑'
				if (this.isActivityStarted) return '活动已开始'
				if (this.isParticipant) return '退出圈子'
				if (this.isFull) return '人数已满'
				return '加入'
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
			isOwnerMember(member) {
				return Number(member && member.ownerFlag) === 1
			},
			isOwnerComment(comment) {
				return String((comment && comment.userId) || '') === String(this.circle.ownerId || '')
			},
			goBack() {
				uni.switchTab({
					url: '/pages/circle/circle'
				});
			},
			navigateToUser() {
				const ownerId = this.circle.ownerId || (this.ownerInfo && this.ownerInfo.userId)
				if (!ownerId) {
					uni.showToast({
						title: '用户信息不存在',
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
							title: '获取圈子详情失败',
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
				const userId = await this.userStore.getUserId()
				const originalJoinStatus = this.circle.joinStatus
				const nextJoinStatus = Number(originalJoinStatus) === 0 ? 1 : 0
				const successTitle = nextJoinStatus === 1 ? '加入成功' : '已退出圈子'
				const fallbackError = nextJoinStatus === 1 ? '加入失败' : '退出失败'

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
						title: '加载中...'
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
						title: '获取用户信息失败，请重试',
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
						title: '加载中...'
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
						title: '获取用户信息失败，请重试',
						icon: 'none'
					})
				}
			},

						// 删除评论
			async deleteComment(comment) {
				uni.showModal({
					title: '确认删除',
					content: '确定要删除这条留言吗？',
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
								uni.showLoading({ title: '删除中...' })
								
								const commentData = this.buildCommentData('delete', comment.messageId)
								const res = await circleApi.updateCircleMessage(commentData)
								if (res.status === 10000) {
									uni.hideLoading()
									uni.showLoading({ title: '刷新中...' })
									const refreshSuccess = await this.refreshCircleDetail()
									uni.hideLoading()
									if (refreshSuccess) {
										uni.showToast({ title: '删除成功', icon: 'success' })
									}
								} else {
									throw new Error(res.message || res.msg || '删除失败')
								}
								} catch (error) {
									uni.hideLoading()
									console.error('删除评论失败:', error)
									uni.showToast({ title: error.message || '删除失败', icon: 'none' })
								}
						}
					}
				})
			},

			// 验证用户信息完整性
			validateUserInfo() {
				const userInfo = this.userStore.userInfo
				if (!userInfo.userName) {
					uni.showToast({ title: '用户名称不能为空', icon: 'none' })
					return false
				}
				if (!toSubmittableImageBase64(userInfo.image)) {
					uni.showToast({ title: '请重新设置头像', icon: 'none' })
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
					uni.showToast({ title: '请输入留言内容', icon: 'none' })
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
					uni.showLoading({ title: '提交中...' })
					
					if (this.editingComment) {
						// 编辑评论
						const commentData = this.buildCommentData('edit', this.editingComment.messageId)
						const res = await circleApi.updateCircleMessage(commentData)
						if (res.status === 10000) {
							uni.hideLoading()
							uni.showLoading({ title: '刷新中...' })
							const refreshSuccess = await this.refreshCircleDetail()
							uni.hideLoading()
							if (refreshSuccess) {
								uni.showToast({ title: '编辑成功', icon: 'success' })
							}
						} else {
							throw new Error(res.message || res.msg || '编辑失败')
						}
					} else {
						// 新增评论
						const commentData = this.buildCommentData('create')
						const res = await circleApi.updateCircleMessage(commentData)
						if (res.status === 10000) {
							uni.hideLoading()
							uni.showLoading({ title: '刷新中...' })
							const refreshSuccess = await this.refreshCircleDetail()
							uni.hideLoading()
							if (refreshSuccess) {
								uni.showToast({ title: '发表成功', icon: 'success' })
							}
						} else {
							throw new Error(res.message || res.msg || '发表失败')
						}
					}
					this.hideCommentModal()
					} catch (error) {
						uni.hideLoading()
						console.error('提交评论失败:', error)
						uni.showToast({ title: error.message || '操作失败', icon: 'none' })
					}
			},

								// 获取评论列表（从圈子详情数据中获取）
			getComments() {
				// 优先使用 circleMessageItemList 字段
				let messageList = this.circle.circleMessageItemList || this.circle.messages || []
				
				if (Array.isArray(messageList)) {
					// 过滤掉已删除的留言（如果有status字段），并按时间排序
					return messageList
						.filter(comment => {
							// 如果没有status字段，默认显示；如果有status字段且为1，则显示
							return !comment.hasOwnProperty('status') || comment.status === 1
						})
						.sort((a, b) => new Date(a.createTime) - new Date(b.createTime))
				}
				return []
			},

			// 检查是否可以管理评论
			canManageComment(comment) {
				return this.isOwner || (this.isParticipant && String(comment.userId || '') === String(this.userId || ''))
			},

			// 检查是否可以编辑评论（只能编辑自己的评论）
			canEditComment(comment) {
				return String(comment.userId || '') === String(this.userId || '')
			},

			// 检查是否可以删除评论（圈主可以删除任何评论，参与者只能删除自己的评论）
			canDeleteComment(comment) {
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
						title: '刷新失败，请重试',
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
		background-color: #fff;

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

			.user-icon {
				.avatar {
					width: 24px;
					height: 24px;
					border-radius: 12px;
				}
			}
		}

		.circle-info {
			padding: 20px 16px;

			.circle-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 20px;

				.creator-text {
					font-size: 16px;
					color: #333;
				}

				.action-btn {
					min-width: 80px;
					font-size: 14px;
					padding: 6px 16px;
					border-radius: 4px;
					margin: 0;

					&.join-btn {
						background-color: #8BC34A;
						color: #fff;

						&.joined {
							background-color: #999;
						}
					}

					&.edit-btn {
						background-color: #4080ff;
						color: #fff;
					}
				}
			}

			.activity-card {
				background-color: #f8f8f8;
				border-radius: 8px;
				padding: 16px;
				margin-bottom: 20px;

				.activity-title {
					font-size: 18px;
					font-weight: 500;
					color: #333;
					text-align: center;
					display: block;
					margin-bottom: 16px;
				}

				.activity-info {
					display: flex;
					justify-content: space-between;
					margin-bottom: 12px;

					.info-item {
						display: flex;
						align-items: center;
						gap: 4px;

						.info-icon {
							font-size: 16px;
						}

						.info-text {
							font-size: 14px;
							color: #666;
						}
					}
				}

				.activity-time {
					margin-bottom: 8px;

					.time-text {
						font-size: 14px;
						color: #333;
					}
				}

				.activity-location {
					.location-text {
					font-size: 14px;
						color: #333;
						margin-right: 8px;
					}

					.location-tip {
						font-size: 12px;
						color: #999;
					}
				}
			}

			.circle-desc {
				margin-bottom: 20px;

				.desc-title {
					font-size: 16px;
					font-weight: 500;
					color: #333;
					margin-bottom: 8px;
					display: block;
				}

				.desc-box {
					background-color: #f5f5f5;
					border-radius: 8px;
					padding: 16px;
				}

				.desc-content {
					font-size: 14px;
					color: #666;
					line-height: 1.6;
				}
			}
		}

		.members-section {
			margin-top: 20px;
			padding: 20px 16px;
			background: #fff;
			border-top: 8px solid #f5f5f5;

			.section-title {
				font-size: 16px;
				font-weight: 500;
				color: #333;
				margin-bottom: 16px;
			}

			.members-list {
				.member-item {
					display: flex;
					align-items: flex-start;
					margin-bottom: 16px;

					&:last-child {
						margin-bottom: 0;
					}

					.member-avatar {
						width: 48px;
						height: 48px;
						border-radius: 24px;
						margin-right: 12px;
					}

					.member-info {
						flex: 1;

						.member-header {
							display: flex;
							align-items: center;
							margin-bottom: 4px;

							.member-name {
								font-size: 16px;
								font-weight: 500;
								color: #333;
								margin-right: 8px;
							}

							.member-tag {
								font-size: 12px;
								color: #4080ff;
								background: rgba(64, 128, 255, 0.1);
								padding: 2px 8px;
								border-radius: 10px;
							}
						}
						
						.member-content{
							flex: 1;
							
								.member-content-text{
									font-size: 14px;
									color: #666;
									line-height: 1.4;
								}
							}
					}
				}
			}
		}

		.comments-section {
			margin-top: 20px;
			padding: 20px 16px;
			background: #fff;
			border-top: 8px solid #f5f5f5;

			.section-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 16px;

				.section-title {
					font-size: 16px;
					font-weight: 500;
					color: #333;
				}
			}

			.comment-input-bar {
				display: flex;
				align-items: center;
				background-color: #fff;
				border: 1px solid #e0e0e0;
				border-radius: 20px;
				padding: 12px 16px;
				margin-bottom: 16px;
				cursor: pointer;
				transition: all 0.2s ease;
				box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

				&:active {
					background-color: #f8f8f8;
					border-color: #8BC34A;
					box-shadow: 0 2px 6px rgba(139, 195, 74, 0.2);
				}

				.input-placeholder {
					flex: 1;

					.placeholder-text {
						font-size: 15px;
						color: #666;
						font-weight: 400;
					}
				}
			}

			.comments-list {
				.comment-item {
					display: flex;
					align-items: flex-start;
					margin-bottom: 16px;

					&:last-child {
						margin-bottom: 0;
					}

					.comment-avatar {
						width: 48px;
						height: 48px;
						border-radius: 24px;
						margin-right: 12px;
					}

					.comment-content {
						flex: 1;

						.comment-header {
								display: flex;
							align-items: center;
							margin-bottom: 4px;

							.comment-name {
								font-size: 16px;
								font-weight: 500;
								color: #333;
								margin-right: 8px;
							}

							.comment-tag {
								font-size: 12px;
								color: #4080ff;
								background: rgba(64, 128, 255, 0.1);
								padding: 2px 8px;
								border-radius: 10px;
							}
						}

						.comment-text {
								font-size: 14px;
								color: #666;
								line-height: 1.4;
						margin-bottom: 8px;
					}

					.comment-footer {
						display: flex;
						align-items: center;
						gap: 16px;

						.comment-time {
							font-size: 12px;
							color: #999;
							flex-shrink: 0;
						}

						.comment-actions {
							display: flex;
							gap: 16px;

							.action-text {
								font-size: 12px;
								color: #999;
								cursor: pointer;

								&:hover {
									color: #666;
								}
							}
						}
					}
					}
				}

				.empty-comments {
					text-align: center;
					padding: 40px 20px;

					.empty-text {
						font-size: 14px;
						color: #999;
					}
				}
			}
		}

		.comment-modal {
			background-color: #fff;
			border-radius: 16px 16px 0 0;
			padding: 20px;

			.modal-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 20px;

				.modal-title {
					font-size: 18px;
					font-weight: 500;
					color: #333;
				}

				.close-btn {
					font-size: 24px;
					color: #999;
					cursor: pointer;
				}
			}

			.modal-content {
				.comment-input {
					width: 100%;
					height: 120px;
					border: 1px solid #e8e8e8;
					border-radius: 8px;
					padding: 12px;
					font-size: 14px;
					margin-bottom: 20px;
					resize: none;
				}

				.modal-actions {
					display: flex;
					gap: 12px;

					.cancel-btn, .submit-btn {
						flex: 1;
						height: 44px;
						border-radius: 22px;
						font-size: 16px;
						border: none;
					}

					.cancel-btn {
						background-color: #f5f5f5;
						color: #666;
					}

					.submit-btn {
						background-color: #000;
						color: #fff;
					}
				}
			}
		}

		.action-btn.disabled {
			background-color: #ccc !important;
			color: #999 !important;
			cursor: not-allowed;
		}
	}
</style>

<style lang="scss" scoped>
	.circle-detail {
		min-height: 100vh;
		padding-bottom: 42px;
		background:
			radial-gradient(circle at top left, rgba(255, 255, 255, 0.95), transparent 34%),
			radial-gradient(circle at bottom right, rgba(231, 200, 171, 0.72), transparent 32%),
			linear-gradient(160deg, #f7f1eb 0%, #efe2d4 46%, #ead8c6 100%) !important;
		color: #2f241d;
		box-sizing: border-box;
	}

	.circle-detail .nav-header {
		position: sticky;
		top: 0;
		z-index: 10;
		display: flex;
		align-items: center;
		gap: 10px;
		padding: calc(var(--status-bar-height) + 14px) 18px 14px;
		border-bottom: 1px solid rgba(82, 49, 31, 0.1);
		background: rgba(255, 250, 245, 0.88) !important;
		color: #2f241d !important;
		backdrop-filter: blur(18px);
	}

	.circle-detail .left-btn {
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

	.circle-detail .header-title {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		color: #2f241d !important;
		font-size: 17px !important;
		font-weight: 900 !important;
		line-height: 1.35;
		text-align: center;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.circle-detail .user-icon {
		display: flex;
		width: 54px;
		justify-content: flex-end;
	}

	.circle-detail .user-icon .avatar {
		width: 34px !important;
		height: 34px !important;
		border-radius: 13px !important;
		background: #f4e7dc;
		box-shadow: 0 8px 18px rgba(111, 61, 29, 0.12);
	}

	.circle-detail .circle-info {
		padding: 18px 18px 0 !important;
	}

	.circle-detail .circle-header {
		display: flex;
		align-items: center;
		gap: 12px;
		justify-content: space-between;
		margin-bottom: 14px !important;
		padding: 0 2px;
	}

	.circle-detail .creator-text {
		flex: 1;
		min-width: 0;
		color: #6f3d1d !important;
		font-size: 14px !important;
		font-weight: 800;
		line-height: 1.45;
	}

	.circle-detail .action-btn {
		min-width: 86px !important;
		height: 40px !important;
		line-height: 40px !important;
		margin: 0 !important;
		padding: 0 16px !important;
		border: 0 !important;
		border-radius: 16px !important;
		background: linear-gradient(135deg, #9c5b2e, #6f3d1d) !important;
		box-shadow: 0 12px 24px rgba(111, 61, 29, 0.18);
		color: #ffffff !important;
		font-size: 14px !important;
		font-weight: 900;
	}

	.circle-detail .action-btn::after,
	.circle-detail .cancel-btn::after,
	.circle-detail .submit-btn::after {
		border: none;
	}

	.circle-detail .action-btn.joined,
	.circle-detail .action-btn.disabled {
		border: 1px solid rgba(82, 49, 31, 0.1) !important;
		background: #f3eee8 !important;
		box-shadow: none;
		color: #a89a91 !important;
	}

	.circle-detail .activity-card,
	.circle-detail .circle-desc .desc-box,
	.circle-detail .members-section,
	.circle-detail .comments-section {
		border: 1px solid rgba(82, 49, 31, 0.12);
		border-radius: 22px;
		background: #fffaf5 !important;
		box-shadow: 0 10px 24px rgba(98, 63, 36, 0.06);
	}

	.circle-detail .activity-card {
		margin: 0 0 16px !important;
		padding: 18px !important;
	}

	.circle-detail .activity-title {
		display: block;
		margin-bottom: 14px !important;
		color: #2f241d !important;
		font-size: 19px !important;
		font-weight: 900 !important;
		line-height: 1.35;
		text-align: left !important;
	}

	.circle-detail .activity-info {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		justify-content: flex-start !important;
		margin-bottom: 12px !important;
	}

	.circle-detail .info-item {
		display: inline-flex;
		align-items: center;
		max-width: 100%;
		min-height: 32px;
		padding: 7px 10px;
		border-radius: 999px;
		background: #f7eadf;
		color: #6f3d1d;
	}

	.circle-detail .info-icon,
	.circle-detail .info-text {
		font-size: 13px !important;
		font-weight: 800;
		color: #6f3d1d !important;
	}

	.circle-detail .activity-time,
	.circle-detail .activity-location {
		margin-top: 10px;
	}

	.circle-detail .time-text,
	.circle-detail .location-text {
		color: #2f241d !important;
		font-size: 14px !important;
		font-weight: 700;
		line-height: 1.5;
	}

	.circle-detail .location-tip {
		display: block;
		margin-top: 4px;
		color: #8a766a !important;
		font-size: 12px !important;
	}

	.circle-detail .circle-desc {
		margin-bottom: 0 !important;
	}

	.circle-detail .desc-title,
	.circle-detail .section-title {
		display: block;
		margin-bottom: 10px !important;
		color: #2f241d !important;
		font-size: 16px !important;
		font-weight: 900 !important;
	}

	.circle-detail .desc-box {
		padding: 16px !important;
	}

	.circle-detail .desc-content,
	.circle-detail .member-content-text,
	.circle-detail .comment-text {
		color: #8a766a !important;
		font-size: 14px !important;
		line-height: 1.6 !important;
	}

	.circle-detail .members-section,
	.circle-detail .comments-section {
		margin: 16px 18px 0 !important;
		padding: 18px !important;
		border-top: 1px solid rgba(82, 49, 31, 0.12) !important;
	}

	.circle-detail .member-item,
	.circle-detail .comment-item {
		display: flex;
		align-items: flex-start;
		margin-bottom: 0 !important;
		padding: 14px 0;
		border-bottom: 1px solid rgba(82, 49, 31, 0.08);
	}

	.circle-detail .member-item:last-child,
	.circle-detail .comment-item:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.circle-detail .member-avatar,
	.circle-detail .comment-avatar {
		width: 46px !important;
		height: 46px !important;
		margin-right: 12px !important;
		border-radius: 16px !important;
		background: #f4e7dc;
		box-shadow: 0 8px 18px rgba(111, 61, 29, 0.1);
	}

	.circle-detail .member-name,
	.circle-detail .comment-name {
		color: #2f241d !important;
		font-size: 15px !important;
		font-weight: 900 !important;
	}

	.circle-detail .member-tag,
	.circle-detail .comment-tag {
		padding: 4px 8px !important;
		border-radius: 999px !important;
		background: #f7eadf !important;
		color: #6f3d1d !important;
		font-size: 11px !important;
		font-weight: 900;
	}

	.circle-detail .comment-input-bar {
		margin-bottom: 4px !important;
		padding: 12px 14px !important;
		border: 1px solid rgba(82, 49, 31, 0.12) !important;
		border-radius: 18px !important;
		background: #ffffff !important;
		box-shadow: none !important;
	}

	.circle-detail .comment-input-bar:active {
		border-color: rgba(156, 91, 46, 0.28) !important;
		background: #fff8f1 !important;
	}

	.circle-detail .placeholder-text,
	.circle-detail .comment-time,
	.circle-detail .action-text,
	.circle-detail .empty-text {
		color: #8a766a !important;
	}

	.circle-detail .comment-modal {
		padding: 20px !important;
		border-radius: 24px 24px 0 0 !important;
		background: #fffaf5 !important;
	}

	.circle-detail .modal-title {
		color: #2f241d !important;
		font-size: 18px !important;
		font-weight: 900 !important;
	}

	.circle-detail .comment-input {
		width: 100%;
		height: 120px !important;
		padding: 12px !important;
		border: 1px solid rgba(82, 49, 31, 0.12) !important;
		border-radius: 18px !important;
		background: #ffffff !important;
		color: #2f241d;
		font-size: 14px !important;
	}

	.circle-detail .cancel-btn,
	.circle-detail .submit-btn {
		height: 44px !important;
		line-height: 44px !important;
		border: 0 !important;
		border-radius: 18px !important;
		font-size: 15px !important;
		font-weight: 900;
	}

	.circle-detail .cancel-btn {
		background: #f3eee8 !important;
		color: #6f3d1d !important;
	}

	.circle-detail .submit-btn {
		background: linear-gradient(135deg, #9c5b2e, #6f3d1d) !important;
		color: #ffffff !important;
	}
</style>
