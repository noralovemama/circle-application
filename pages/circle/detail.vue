<template>
	<view class="circle-detail">
		<!-- 顶部导航栏 -->
		<view class="nav-header">
			<view class="left-btn" @click="goBack">返回</view>
			<text class="header-title">{{ circle.circleName }}</text>
			<view class="user-icon" @click="navigateToUser">
				<image class="avatar" :src="ownerInfo?.image" mode="aspectFill"></image>
			</view>
		</view>

		<!-- 圈子信息 -->
		<view class="circle-info">
			<!-- 创建人和加入按钮 -->
			<view class="circle-header">
				<text class="creator-text">{{ circle.ownerName }}想和大家一起</text>
				<button class="action-btn"
					:class="{ 'edit-btn': isOwner, 'join-btn': !isOwner, 'joined': circle.joinStatus === 1, 'disabled': isActivityStarted || isFull }"
					@click="handleAction"
					:disabled="isActivityStarted || isFull">
					{{ buttonText }}
				</button>
			</view>

			<!-- 活动详情卡片 -->
			<view class="activity-card">
				<text class="activity-title">{{ circle.circleName }}</text>
				<view class="activity-info">
					<view class="info-item">
						<text class="info-icon">💰</text>
						<text class="info-text">{{ formatBudget(circle.budget) }}</text>
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
		<view class="members-section" v-if="circle.circleUserItemList?.length">
			<view class="section-title">圈子成员</view>
			<view class="members-list">
				<view class="member-item" v-for="member in circle.circleUserItemList" :key="member.userId">
					<image :src="getAvatar(member)" class="member-avatar" mode="aspectFill"></image>
					<view class="member-info">
						<view class="member-header">
							<text class="member-name">{{ member.userName }}</text>
							<text class="member-tag" v-if="member.ownerFlag === 1">圈主</text>
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
					<image :src="comment.userImage || '/static/default-avatar.png'" class="comment-avatar" mode="aspectFill"></image>
					<view class="comment-content">
						<view class="comment-header">
							<text class="comment-name">{{ comment.userName }}</text>
							<text class="comment-tag" v-if="comment.userId === circle.ownerId">圈主</text>
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
				return this.circle.ownerId === this.userId
			},
			isParticipant() {
				return this.circle.joinStatus === 1
			},
			isActivityStarted() {
				if (!this.circle.activityTime) return false
				const activityTime = new Date(this.circle.activityTime)
				return activityTime < new Date()
			},
			isFull() {
				return this.circle.circleUserItemList?.length >= this.circle.maxMembers
			},
			remainingSpots() {
				const currentMembers = this.circle.circleUserItemList?.length || 0
				return Math.max(0, this.circle.maxMembers - currentMembers)
			},
			buttonText() {
				if (this.isOwner) return '编辑'
				if (this.isActivityStarted) return '活动已开始'
				if (this.isFull) return '人数已满'
				return this.circle.joinStatus === 1 ? '您已加入' : '加入'
			},
			ownerInfo() {
				return this.circle.circleUserItemList?.find(member => member.ownerFlag === 1)
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
					}
				})
			},
			getAvatar(item) {
				return item.image ? item.image : "/static/default-avatar.png";
			},
			goBack() {
				uni.switchTab({
					url: '/pages/circle/circle'
				});
			},
			navigateToUser() {
				uni.navigateTo({
					url: '/pages/user/user'
				})
			},
			
			async loadCircleDetail(options, longitude, latitude){
				this.userId = await uni.getStorageSync('token')
				if (options?.circleId) {
					// 先用路由参数设置基本信息
					this.circle = {
						...this.circle,
						circleId: options.circleId,
					}
				
					// 获取详细信息 
					try {
						const openId = await uni.getStorageSync('token') || ''
						const res = await circleApi.getCircleDetail(options.circleId, openId, this.longitude, this
							.latitude)
						if (res.status === 10000 && res.data) {
							this.circle = res.data
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
				const openId = await uni.getStorageSync('token') || ''
				if (this.circle.joinStatus === 0) {
					this.circle.joinStatus = 1
					const res = await circleApi.bindCirCle({
						circleId: this.circle.circleId,
						userId: openId,
						status: 1
					})
					if (res.status === 10000 && res.data) {
						uni.showToast({
							title: '加入成功',
							icon: 'success'
						})
					} else {
						uni.showToast({
							title: '加入失败' + res.data.msg,
							icon: 'error'
						})
					}

				} else {
					this.circle.joinStatus = 0
					const res = await circleApi.bindCirCle({
						circleId: this.circle.circleId,
						userId: openId,
						status: 0
					})
					if (res.status === 10000 && res.data) {
						uni.showToast({
							title: '已退出圈子',
							icon: 'none'
						})
					} else {
						uni.showToast({
							title: '退出失败' + res.data.msg,
							icon: 'error'
						})
					}
				}
				await this.loadCurrentPage(this.options)
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
				if (!budget) return '免费'
				return budget
			},

			// 格式化活动时间
			formatActivityTime(time) {
				if (!time) return '时间待定'
				const date = new Date(time)
				const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
				const weekday = weekdays[date.getDay()]
				const month = (date.getMonth() + 1).toString().padStart(2, '0')
				const day = date.getDate().toString().padStart(2, '0')
				const hours = date.getHours().toString().padStart(2, '0')
				const minutes = date.getMinutes().toString().padStart(2, '0')
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
								}
							} catch (error) {
								uni.hideLoading()
								console.error('删除评论失败:', error)
								uni.showToast({ title: '删除失败', icon: 'none' })
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
				if (!userInfo.image) {
					uni.showToast({ title: '用户头像不能为空', icon: 'none' })
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
					userImage: this.userStore.userInfo.image,
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
						}
					}
					this.hideCommentModal()
				} catch (error) {
					uni.hideLoading()
					console.error('提交评论失败:', error)
					uni.showToast({ title: '操作失败', icon: 'none' })
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
				return this.isOwner || (this.isParticipant && comment.userId === this.userId)
			},

			// 检查是否可以编辑评论（只能编辑自己的评论）
			canEditComment(comment) {
				return comment.userId === this.userId
			},

			// 检查是否可以删除评论（圈主可以删除任何评论，参与者只能删除自己的评论）
			canDeleteComment(comment) {
				return this.isOwner || comment.userId === this.userId
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