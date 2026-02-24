<template>
	<view class="container">
		<!-- 顶部图片 -->
		<view class="image-placeholder">
			<image class="top-image" src="/static/share-cover.png" mode="aspectFill"></image>
		</view>
		
		<!-- Tab导航 -->
		<view class="tab-nav">
			<view 
				class="tab-item" 
				:class="{ active: isFromHome }"
				@click="switchTab('around')"
			>
				<text class="tab-text">我周围的圈子</text>
			</view>
			<view 
				class="tab-item" 
				:class="{ active: !isFromHome }"
				@click="switchTab('my')"
			>
				<text class="tab-text">我的圈子</text>
			</view>
		</view>

		<!-- 列表区域 -->
		<scroll-view class="scroll-view" scroll-y @scrolltolower="loadMore">
			<!-- 列表内容 -->
			<view class="list">
				<view 
					class="item" 
					:class="{ 'item-disabled': isCircleStarted(item) }"
					v-for="item in circleStore.list" 
					:key="item.circleId"
				>
					<view class="item-content">
						<image 
							class="avatar" 
							:class="{ 'avatar-disabled': isCircleStarted(item) }"
							:src="getAvatar(item)" 
							mode="aspectFill" 
							@click.stop="navigateToUserProfile(item)"
						/>
						<view class="info" :class="{ 'info-disabled': isCircleStarted(item) }">
							<text class="owner">{{getOwnerName(item)}}发起</text>
							<text class="slogan">{{item.circleName}}</text>
							<view class="meta">
								<text class="time">{{item.createTime}}</text>
								<text class="distance">{{item.distance}}公里</text>
								<text v-if="isCircleStarted(item)" class="status-tag">已开始</text>
							</view>
						</view>
						<button 
							class="view-btn" 
							:class="{ 
								'view-btn-disabled': isCircleStarted(item)
							}"
							:disabled="isCircleStarted(item)"
							@click.stop="navigateToDetail(item)"
						>
							<text class="btn-text">
								{{ isCircleStarted(item) ? '已开始' : '查看' }}
							</text>
						</button>
					</view>
				</view>
			</view>

			<!-- 加载提示 -->
			<view class="loading" v-if="circleStore.loading">加载中...</view>
			<view class="no-more" v-if="!circleStore.loading && !circleStore.pagination.hasMore">
				没有更多了
			</view>
		</scroll-view>

		<!-- 底部按钮 -->
		<view class="footer">
			<button class="create-btn" @click="createCircle">
				<text class="btn-text">创建你的圈子</text>
			</button>
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
				// 当 activityTime 为 undefined 时不置灰
				if (!item.activityTime) {
					return false
				}
				
				// 仅基于 activityTime 判断，格式为 "2025-08-15 14:10:00"
				if (typeof item.activityTime === 'string') {
					const activityDate = new Date(item.activityTime)
					// 检查日期是否有效
					if (!isNaN(activityDate.getTime())) {
						return Date.now() > activityDate.getTime()
					}
				}
				
				// 默认返回false（未开始）
				return false
			},
			async loadCurrentPage(options){
				const userId = await uni.getStorageSync('token')
				console.log('loadCurrentPage options:', options)
				
				// 根据传入的type参数来确定显示类型
				if (options && options.type) {
					this.isFromHome = options.type === 'around'
					console.log('根据参数设置isFromHome:', this.isFromHome)
				} else {
					// 默认显示周围的圈子
					this.isFromHome = true
				}
				
				uni.setNavigationBarTitle({
					title: this.isFromHome ? '圈子' : '我的圈子'
				})
				
				// #ifdef MP-WEIXIN
				if (uni.getSystemInfoSync().platform === 'devtools') {
					console.log('模拟器环境，使用默认位置信息')
					let param = {
						isRefresh: true,
						longitude: 116.24145697699653,
						latitude: 39.93208468967014
					}
					// 如果是"我的圈子"，需要传入userId
					if (!this.isFromHome && userId) {
						param['userId'] = userId
					}
					if (this.isFromHome) {
						param['flag'] = 0
					}else{
						param['flag'] = 1
					}
					console.log('加载圈子列表参数:', param)
					this.circleStore.getCircleList(param)
					return
				}
				// #endif
				
				uni.getLocation({
					type: 'gcj02',
					success: ({
						longitude,
						latitude
					}) => {
						let param = {
							isRefresh: true,
							longitude,
							latitude
						}
						// 如果是"我的圈子"，需要传入userId
						if (!this.isFromHome && userId) {
							param['userId'] = userId
						}
						if (this.isFromHome) {
							param['flag'] = 0
						}else{
							param['flag'] = 1
						}
						console.log('加载圈子列表参数:', param)
						this.circleStore.getCircleList(param)
					},
					fail: (err) => {
						// let param = {
						// 	isRefresh: true
						// }
						// if (!this.isFromHome && userId) {
						// 	param['userId'] = userId
						// }
						// console.error('获取位置失败：', err)
						// this.circleStore.getCircleList(param)
						uni.showToast({
							title: err.message || '获取位置失败',
							icon: 'none'
						})
					}
				})
			},
			
			loadMore() {
				// console.log('触发加载更多')
				// if (!this.circleStore.loading && this.circleStore.pagination.hasMore) {
				// 	this.circleStore.getCircleList({
				// 		isRefresh: true
				// 	})
				// }
			},

			getAvatar(item) {
				return item.ownerImage ? item.ownerImage : "/static/default-avatar.png";
			},

			getOwnerName(item) {
				return item.ownerName ? item.ownerName : "某某"
			},

			async createCircle() {
				await this.userStore.checkLoginStatus()
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

			switchTab(tab) {
				this.isFromHome = tab === 'around'
				// 清空当前列表数据
				this.circleStore.list = []
				// 重新加载对应类型的数据
				this.loadCurrentPage({
					type: this.isFromHome ? 'around' : 'my'
				})
			}
		}
	}
</script>

<style lang="scss" scoped>
	.container {
		height: 100vh;
		display: flex;
		flex-direction: column;
		background: #fff;
	}

	.image-placeholder {
		height: 200px;
		background: #f0f0f0;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		
		.top-image {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
	}

	.tab-nav {
		display: flex;
		background: #fff;
		border-bottom: 1px solid #f0f0f0;
		
		.tab-item {
			flex: 1;
			height: 44px;
			display: flex;
			align-items: center;
			justify-content: center;
			position: relative;
			
			.tab-text {
				font-size: 16px;
				color: #666;
				font-weight: normal;
			}
			
			&.active {
				.tab-text {
					color: #000;
					font-weight: bold;
				}
				
				&::after {
					content: '';
					position: absolute;
					bottom: 0;
					left: 0;
					right: 0;
					height: 2px;
					background: #000;
				}
			}
		}
	}

	.scroll-view {
		flex: 1;
		height: 0;
	}

	.list {
		padding: 0 12px;

		.item {
			padding: 16px 0;
			border-bottom: 1px solid #f5f5f5;

			.item-content {
				display: flex;
				align-items: center;
				width: 100%;
				box-sizing: border-box;
			}
			
			// 已开始的圈子整体置灰
			&.item-disabled {
				opacity: 0.6;
			}

			.avatar {
				width: 40px;
				height: 40px;
				border-radius: 20px;
				margin-right: 10px;
				background: #f5f5f5;
				flex-shrink: 0;
				
				&.avatar-disabled {
					filter: grayscale(50%);
				}
			}

			.info {
				flex: 1;
				margin-right: 8px;
				min-width: 0;
				overflow: hidden;

				&.info-disabled {
					.slogan, .owner {
						color: #999;
					}
					.meta {
						color: #ccc;
					}
				}

				.slogan {
					font-size: 16px;
					color: #333;
					font-weight: bold;
					margin-bottom: 4px;
					display: block;
					text-align: left;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
				}

				.owner {
					font-size: 14px;
					color: #666;
					margin-bottom: 4px;
					display: block;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
				}

				.meta {
					font-size: 12px;
					color: #999;
					display: flex;
					align-items: center;
					flex-wrap: wrap;
					gap: 8px;

					.time, .distance {
						white-space: nowrap;
					}
					
					.status-tag {
						background: rgba(255, 152, 0, 0.1);
						color: #ff9800;
						font-size: 10px;
						padding: 2px 6px;
						border-radius: 8px;
						border: 1px solid rgba(255, 152, 0, 0.3);
						white-space: nowrap;
					}
				}
			}

			.view-btn {
				min-width: 56px;
				height: 32px;
				line-height: 30px;
				font-size: 14px;
				color: #4080ff;
				background: rgba(64, 128, 255, 0.1);
				border: 1px solid #4080ff;
				border-radius: 16px;
				padding: 0 12px;
				margin: 0;
				transition: all 0.3s ease;
				flex-shrink: 0;
				white-space: nowrap;

				&:active {
					background: rgba(64, 128, 255, 0.2);
					transform: scale(0.98);
				}
				
				&.view-btn-disabled {
					color: #ccc;
					background: #f5f5f5;
					border-color: #ddd;
					cursor: not-allowed;
					
					&:active {
						background: #f5f5f5;
						transform: none;
					}
				}

				.btn-text {
					display: inline-block;
					vertical-align: middle;
				}

				&::after {
					border: none;
				}
			}
		}
	}

	.loading,
	.no-more {
		text-align: center;
		padding: 16px;
		color: #999;
		font-size: 14px;
	}

	.footer {
		padding: 12px;
		border-top: 1px solid #f5f5f5;
		background: rgba(255, 255, 255, 0.98);
		backdrop-filter: blur(10px);

		.create-btn {
			background: linear-gradient(135deg, #4080ff 0%, #3366ff 100%);
			color: #fff;
			height: 44px;
			line-height: 44px;
			font-size: 16px;
			font-weight: 500;
			border-radius: 22px;
			border: none;
			box-shadow: 0 4px 12px rgba(64, 128, 255, 0.2);
			transition: all 0.3s ease;

			.btn-text {
				display: inline-block;
				vertical-align: middle;
			}

			&:active {
				transform: translateY(1px);
				box-shadow: 0 2px 8px rgba(64, 128, 255, 0.15);
			}

			&::after {
				border: none;
			}
		}
	}
</style>