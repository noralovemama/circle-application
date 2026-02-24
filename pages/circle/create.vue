<template>
	<view class="create-container">
		<!-- 顶部导航栏 -->
		<view class="nav-header">
			<view class="left-btn" @click="goBack">返回</view>
			<text class="header-title">{{ isEdit ? '编辑圈子' : '创建圈子' }}</text>
			<view class="right-placeholder"></view>
		</view>

		<!-- 表单区域 -->
		<view class="form-section">
			<!-- 创建人信息 -->
			<view class="circle-header">
				<text class="creator-text">{{ userStore?.userInfo?.userName || '我' }}想和大家一起</text>
			</view>
			
			<view class="form-item">
				<text class="label">圈子名称<text class="required">*</text></text>
				<input class="input" v-model="formData.circleName" placeholder="给圈子起个名字" />
			</view>

			<view class="form-item">
				<text class="label">预算<text class="required">*</text></text>
				<input 
					class="input" 
					type="number" 
					v-model="formData.money" 
					placeholder="请输入预算金额（元/人）" 
					@input="onMoneyInput"
					@blur="onMoneyBlur"
				/>
				<text class="hint">请输入0或正整数</text>
			</view>

			<view class="form-item">
				<text class="label">圈子描述<text class="required">*</text></text>
				<textarea class="textarea" maxlength="3000" v-model="formData.introduction" placeholder="请输入圈子描述" />
			</view>

			<!-- 位置选择 -->
			<view class="form-item">
				<text class="label">位置<text class="required">*</text></text>
				<view class="location-picker" @click="openMap">
					<text class="location-text">{{ formData.location || '点击选择位置' }}</text>
					<uni-icons type="right" size="16"></uni-icons>
				</view>
			</view>

			<!-- 活动日期 -->
			<view class="form-item">
				<text class="label">活动日期<text class="required">*</text></text>
				<picker mode="date" :value="formData.activityDate" :start="todayDate" @change="onActivityDateChange">
					<view class="picker">
						<text>{{ formData.activityDate || '选择日期' }}</text>
						<uni-icons type="right" size="16"></uni-icons>
					</view>
				</picker>
			</view>
			
			<!-- 活动时间 -->
			<view class="form-item">
				<text class="label">活动时间<text class="required">*</text></text>
				<picker mode="time" :value="formData.activityTime" :start="getMinTime()" @change="onActivityTimeChange">
					<view class="picker">
						<text>{{ formData.activityTime || '选择时间' }}</text>
						<uni-icons type="right" size="16"></uni-icons>
					</view>
				</picker>
			</view>

		</view>

		<!-- 保存按钮 -->
		<button class="save-btn" @click="saveCircle" :disabled="isSaving">{{ isSaving ? '保存中...' : '保存' }}</button>

		<!-- 底部占位 -->
		<view class="bottom-space"></view>
	</view>
</template>

<script>
	import circleApi from '@/request/api/circle'
	import userApi from '@/request/api/user'
	import {
		useUserStore,
		
	} from '@/store/user'
	import { useCircleStore } from '@/store/circle'

	export default {
		data() {
			return {
				circleId: '',
				userId: '',
				isEdit: false,
				formData: {
					circleName: '',
					money: '',
					introduction: '',
					location: '',
					address: '',
					latitude: '',
					longitude: '',
					activityDate: '',
					activityTime: '',
				},
				longitude: '',
				latitude: '',
				isSaving: false,
				todayDate: '',  // 今天的日期，用于限制日期选择
				currentTime: ''  // 当前时间，用于限制时间选择
			}
		},

		async onLoad(options) {
			this.userStore = useUserStore()
			this.circleStore = useCircleStore()
			
			// 设置今天的日期和当前时间（用于限制日期时间选择）
			const now = new Date();
			const year = now.getFullYear();
			const month = String(now.getMonth() + 1).padStart(2, '0');
			const day = String(now.getDate()).padStart(2, '0');
			const hour = String(now.getHours()).padStart(2, '0');
			const minute = String(now.getMinutes()).padStart(2, '0');
			
			this.todayDate = `${year}-${month}-${day}`
			this.currentTime = `${hour}:${minute}`
			
			// 确保用户信息加载成功
			const userInfoLoaded = await this.loadUserProfile()
			if (!userInfoLoaded) {
				return
			}
			
			if (options.circleId) {
				this.circleId = options.circleId
				this.isEdit = true
				await this.loadCircleData()
			} else {
				// 获取当前日期和时间
				const hour = String(now.getHours()).padStart(2, '0');
				const minute = String(now.getMinutes()).padStart(2, '0');

				// 格式化日期和时间 yyyy-MM-dd HH:mm:ss
				this.formData.activityDate = `${year}-${month}-${day}`;
				this.formData.activityTime = `${hour}:${minute}`;
			}
		},

		methods: {
			goBack() {
				const pages = getCurrentPages()
				if (pages.length > 1) {
					uni.navigateBack()
				} else {
					// 如果是第一个页面，跳转到圈子列表页
					uni.switchTab({
						url: '/pages/circle/circle'
					})
				}
			},
			async loadUserProfile() {
				try {
					// 确保用户信息完整
					await this.userStore.ensureUserInfo()
					
					// 验证用户信息是否完整
					const userInfo = this.userStore.userInfo
					if (!userInfo.userName || !userInfo.image) {
						uni.showToast({
							title: '请先完善个人信息',
							icon: 'none'
						})
						// 跳转到用户信息页面（tabbar页面）
						setTimeout(() => {
							uni.switchTab({
								url: '/pages/user/user'
							})
						}, 1500)
						return false
					}
					return true
				} catch (error) {
					console.error('加载用户信息失败:', error)
					uni.showToast({
						title: '加载用户信息失败',
						icon: 'none'
					})
					return false
				}
			},
			async loadCircleData() {
				// #ifdef MP-WEIXIN
				if (uni.getSystemInfoSync().platform === 'devtools') {
					console.log('模拟器环境，使用默认位置信息')
					const longitude = 116.24145697699653
					const latitude = 39.93208468967014
					await this.loadCircleDataReal(longitude, latitude)
					return
				}
				// #endif

				uni.getLocation({
					type: 'gcj02',
					success: async ({
						longitude,
						latitude
					}) => {
						await this.loadCircleDataReal(longitude, latitude)
					},
					fail: (err) => {
						console.error('获取位置失败：', err)
					}
				})

			},

			async loadCircleDataReal(longitude, latitude) {
				try {
					this.userId = await uni.getStorageSync('token')
					const res = await circleApi.getCircleDetail(this.circleId, this.userId, longitude, latitude)
					if (res.status === 10000) {
						const {
							data
						} = res
						// 示例时间戳，精确到秒，实际使用时替换为真实的时间戳
						const timestamp = data.activityTime;
						// 将时间戳转换为 Date 对象
						const dateObj = new Date(timestamp);

						// 提取日期部分，格式为 YYYY-MM-DD
						const year = dateObj.getFullYear();
						const month = String(dateObj.getMonth() + 1).padStart(2, '0');
						const day = String(dateObj.getDate()).padStart(2, '0');
						const date = `${year}-${month}-${day}`;

						// 提取时间部分，格式为 HH:MM
						const hours = String(dateObj.getHours()).padStart(2, '0');
						const minutes = String(dateObj.getMinutes()).padStart(2, '0');
						const time = `${hours}:${minutes}`;
						this.formData = {
							circleName: data.circleName,
							introduction: data.introduction,
							location: data.activityLocation,
							latitude: data.latitude,
							longitude: data.longitude,
							activityTime: time,
							activityDate: date,
							money: data.money ? data.money.toString() : ''
						}
						
						// 编辑模式下检查活动时间是否是过去的时间
						this.validateEditDateTime()
					}
				} catch (error) {
					uni.showToast({
						title: '加载数据失败',
						icon: 'none'
					})
				}

			},

			openMap() {
				uni.chooseLocation({
					success: (res) => {
						console.info('选择位置：', res)
						this.formData.location = res.address
						this.formData.address = res.address
						this.formData.latitude = res.latitude
						this.formData.longitude = res.longitude
					},
					fail: (err) => {
						console.error('选择位置失败：', err)
						if (process.env.NODE_ENV === 'development') {
							const mockLocation = {
								name: '杭州市西湖区黄龙时代广场',
								address: '浙江省杭州市西湖区黄龙时代广场B座',
								latitude: 30.274085,
								longitude: 120.13802
							}
							this.formData.location = mockLocation.address
							this.formData.address = mockLocation.address
							this.formData.latitude = mockLocation.latitude
							this.formData.longitude = mockLocation.longitude
						}
					}
				})
			},

			onMoneyInput(e) {
				let value = e.detail.value
				
				// 只允许输入数字
				value = value.replace(/[^\d]/g, '')
				
				// 如果输入为空，清空表单数据
				if (!value || value.trim() === '') {
					this.formData.money = ''
					return
				}
				
				// 转换为数字类型
				const numValue = parseInt(value) || 0
				
				// 更新表单数据
				this.formData.money = numValue.toString()
			},
			
			onMoneyBlur(e) {
				const value = e.detail.value
				
				// 如果输入为空，显示提示
				if (!value || value.trim() === '') {
					uni.showToast({
						title: '请填写预算金额',
						icon: 'none',
						duration: 1500
					})
					return
				}
				
				// 验证是否为有效数字
				const numValue = parseInt(value)
				if (isNaN(numValue) || numValue < 0) {
					uni.showToast({
						title: '请输入有效的预算金额',
						icon: 'none',
						duration: 1500
					})
					return
				}
			},



			onActivityDateChange(e) {
				const selectedDate = e.detail.value
				this.formData.activityDate = selectedDate
				
				// 如果选择的是今天，检查时间是否合理，并可能需要重置时间
				if (selectedDate === this.todayDate) {
					// 如果当前选择的时间早于现在的时间，自动调整
					if (this.formData.activityTime && this.formData.activityTime < this.currentTime) {
						// 自动调整为当前时间后1小时
						const now = new Date()
						const futureTime = new Date(now.getTime() + 60 * 60 * 1000)
						const hours = String(futureTime.getHours()).padStart(2, '0')
						const minutes = String(futureTime.getMinutes()).padStart(2, '0')
						this.formData.activityTime = `${hours}:${minutes}`
						
						uni.showToast({
							title: '时间已自动调整为1小时后',
							icon: 'none',
							duration: 2000
						})
					}
					this.validateCurrentDateTime()
				}
			},
			
			onActivityTimeChange(e) {
				this.formData.activityTime = e.detail.value
				
				// 如果选择的是今天，检查时间是否合理
				if (this.formData.activityDate === this.todayDate) {
					this.validateCurrentDateTime()
				}
			},
			
			// 验证当前日期时间是否合理（不能是过去的时间）
			validateCurrentDateTime() {
				if (this.formData.activityDate === this.todayDate && this.formData.activityTime) {
					const now = new Date()
					const selectedDateTime = new Date(`${this.formData.activityDate}T${this.formData.activityTime}:00`)
					
					if (selectedDateTime <= now) {
						// 选择的时间已过去，自动调整为当前时间后1小时
						const futureTime = new Date(now.getTime() + 60 * 60 * 1000) // 加1小时
						const hours = String(futureTime.getHours()).padStart(2, '0')
						const minutes = String(futureTime.getMinutes()).padStart(2, '0')
						
						this.formData.activityTime = `${hours}:${minutes}`
						
						uni.showToast({
							title: '活动时间不能是过去，已自动调整',
							icon: 'none',
							duration: 2000
						})
					}
				}
			},
			
			// 获取时间选择器的最小时间
			getMinTime() {
				// 如果选择的日期是今天，则限制为当前时间
				if (this.formData.activityDate === this.todayDate) {
					return this.currentTime
				}
				// 如果选择的是未来日期，不限制时间
				return "00:00"
			},
			
			// 编辑模式下验证加载的日期时间
			validateEditDateTime() {
				if (this.formData.activityDate && this.formData.activityTime) {
					const now = new Date()
					const activityDateTime = new Date(`${this.formData.activityDate}T${this.formData.activityTime}:00`)
					
					if (activityDateTime <= now) {
						// 如果加载的活动时间已经是过去时间，自动调整为当前时间后1小时
						const futureTime = new Date(now.getTime() + 60 * 60 * 1000)
						const year = futureTime.getFullYear()
						const month = String(futureTime.getMonth() + 1).padStart(2, '0')
						const day = String(futureTime.getDate()).padStart(2, '0')
						const hours = String(futureTime.getHours()).padStart(2, '0')
						const minutes = String(futureTime.getMinutes()).padStart(2, '0')
						
						this.formData.activityDate = `${year}-${month}-${day}`
						this.formData.activityTime = `${hours}:${minutes}`
						
						uni.showModal({
							title: '活动时间调整',
							content: '原活动时间已过期，已自动调整为当前时间后1小时。您可以重新选择合适的时间。',
							showCancel: false,
							confirmText: '知道了'
						})
					}
				}
			},

			updatePreview() {
				// 可以在这里添加预览逻辑
			},

			async saveCircle() {
			const requiredFields = {
				circleName: '圈子名称',
				money: '预算',
				introduction: '圈子描述',
				location: '位置',
				activityTime: '活动时间',
				activityDate: '活动日期',
			}

				for (const [field, label] of Object.entries(requiredFields)) {
					if (!this.formData[field]) {
						uni.showToast({
							title: `请填写${label}`,
							icon: 'none'
						})
						return
					}
				}
				
				// 验证money是否为有效的非负整数且不为空
				if (!this.formData.money || this.formData.money.trim() === '') {
					uni.showToast({
						title: '请填写预算',
						icon: 'none'
					})
					return
				}
				
				const moneyValue = parseInt(this.formData.money)
				if (isNaN(moneyValue) || moneyValue < 0) {
					uni.showToast({
						title: '请输入有效的预算金额',
						icon: 'none'
					})
					return
				}
				
				// 验证活动日期时间不能是过去
				const activityDateTime = new Date(`${this.formData.activityDate}T${this.formData.activityTime}:00`)
				const now = new Date()
				
				if (activityDateTime <= now) {
					uni.showToast({
						title: '活动时间不能是过去的时间',
						icon: 'none'
					})
					return
				}

				if (this.isSaving) return
				this.isSaving = true

				try {
					// 确保用户信息完整
					await this.userStore.ensureUserInfo()
					const userInfo = this.userStore.userInfo
					
				if (this.isEdit) {
					// 编辑模式下也要验证活动时间不能是过去
					const activityDateTime = new Date(`${this.formData.activityDate}T${this.formData.activityTime}:00`)
					const now = new Date()
					
					if (activityDateTime <= now) {
						uni.showToast({
							title: '活动时间不能是过去的时间',
							icon: 'none'
						})
						return
					}
					
					// 获取用户信息用于更新
					const ownerId = await this.userStore.getOpenId()
					const ownerName = userInfo.userName
					const ownerImage = userInfo.image
					
					// 直接使用 money 字段，并添加用户信息
					const updateData = {
						circleId: this.circleId,
						...this.formData,
						ownerId,
						ownerName,
						ownerImage
					}
					await circleApi.updateCircle(updateData)
					} else {
						const ownerId = await this.userStore.getOpenId()
						const ownerName = userInfo.userName
						const ownerImage = userInfo.image
						
				// 将用户头像添加到表单数据中，直接使用 money 字段
				const createData = {
					...this.formData,
					ownerImage
				}
				
				await circleApi.createCircle(createData, ownerId, ownerName)
					}

					uni.showToast({
						title: '保存成功',
						icon: 'success'
					})
					
					// 如果是创建新圈子（非编辑模式），标记需要刷新主页数据
					if (!this.isEdit) {
						this.circleStore.markNeedRefresh()
					}
					
					const circleId = this.circleId
					setTimeout(() => {
						const pages = getCurrentPages()
						if (this.isEdit && pages.length > 1) {

							if (circleId) {
								uni.navigateTo({
									url: `/pages/circle/detail?circleId=${circleId}`
								})
							} else {
								uni.navigateBack()
							}

						} else {
							uni.switchTab({
								url: '/pages/circle/circle'
							})
						}
					}, 1500)
				} catch (error) {
					console.error('创建圈子失败:', error)
					uni.showToast({
						title: error.message || '创建失败，请重试',
						icon: 'none',
						duration: 2000
					})
				} finally {
					this.isSaving = false
				}
			}
		}
	}
</script>

<style lang="scss" scoped>
	.create-container {
		min-height: 100vh;
		background-color: #fff;
		padding-bottom: 50px;

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

		.form-section {
			padding: 20px 16px;

			.circle-header {
				margin-bottom: 20px;

				.creator-text {
					font-size: 16px;
					color: #333;
				}
			}

			.form-item {
				margin-bottom: 20px;

				.label {
					font-size: 16px;
					color: #333;
					margin-bottom: 8px;
					display: block;
					
					.required {
						color: #ff4757;
						margin-left: 2px;
					}
				}

				.input {
					width: 100%;
					height: 44px;
					border: 1px solid #e8e8e8;
					border-radius: 4px;
					padding: 0 12px;
					font-size: 14px;
					box-sizing: border-box;
				}

				.textarea {
					width: 100%;
					min-height: 80px;
					border: 1px solid #e8e8e8;
					border-radius: 4px;
					padding: 12px;
					font-size: 14px;
					resize: none;
					box-sizing: border-box;
				}

				.hint {
					font-size: 12px;
					color: #999;
					margin-top: 4px;
					display: block;
				}

				.location-picker,
				.picker {
					width: 100%;
					height: 44px;
					border: 1px solid #e8e8e8;
					border-radius: 4px;
					padding: 0 12px;
					display: flex;
					justify-content: space-between;
					align-items: center;
					font-size: 14px;
					color: #333;
					box-sizing: border-box;
				}

				.location-picker {
					width: 100%;
					min-height: 44px;
					border: 1px solid #e8e8e8;
					border-radius: 4px;
					padding: 8px 12px;
					display: flex;
					justify-content: space-between;
					align-items: center;
					font-size: 14px;
					color: #333;
					box-sizing: border-box;

					.location-text {
						flex: 1;
						margin-right: 8px;
						word-break: break-all;
					}
				}
			}
		}

		.save-btn {
			position: fixed;
			bottom: 34px;
			left: 50%;
			transform: translateX(-50%);
			width: 200px;
			height: 44px;
			line-height: 44px;
			background-color: #fff;
			color: #333;
			font-size: 16px;
			border: 1px solid #e8e8e8;
			border-radius: 22px;
			text-align: center;

			&:disabled {
				opacity: 0.5;
				background-color: #ccc;
			}
		}

		.bottom-space {
			height: 50px;
		}
	}
</style>