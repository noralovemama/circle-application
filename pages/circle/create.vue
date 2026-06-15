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
				<text class="creator-text">{{ getCreatorName() }}想和大家一起</text>
			</view>
			
			<view class="form-item">
				<text class="label">圈子名称<text class="required">*</text></text>
				<input class="input" v-model="formData.circleName" @input="onFieldInput('circleName', $event)" placeholder="给圈子起个名字" />
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
				<textarea class="textarea" maxlength="3000" v-model="formData.introduction" @input="onFieldInput('introduction', $event)" placeholder="请输入圈子描述" />
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
		<button class="save-btn" :class="{ 'save-btn-disabled': isSaving }" @click="saveCircle" :disabled="isSaving">{{ isSaving ? '保存中...' : '保存' }}</button>

		<!-- 底部占位 -->
		<view class="bottom-space"></view>
	</view>
</template>

<script>
	import circleApi from '@/request/api/circle'
	import userApi from '@/request/api/user'
	import { pad2, toSubmittableImageBase64 } from '@/utils/image'
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
			const month = pad2(now.getMonth() + 1);
			const day = pad2(now.getDate());
			const hour = pad2(now.getHours());
			const minute = pad2(now.getMinutes());
			
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
				const defaultActivityTime = this.formatDateParts(new Date(now.getTime() + 60 * 60 * 1000))
				this.formData.activityDate = defaultActivityTime.date;
				this.formData.activityTime = defaultActivityTime.time;
			}
		},

		methods: {
			getCreatorName() {
				return (this.userStore && this.userStore.userInfo && this.userStore.userInfo.userName) || '我'
			},

			onFieldInput(field, e) {
				this.formData[field] = e.detail.value
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

			formatDateParts(dateObj) {
				return {
					date: `${dateObj.getFullYear()}-${pad2(dateObj.getMonth() + 1)}-${pad2(dateObj.getDate())}`,
					time: `${pad2(dateObj.getHours())}:${pad2(dateObj.getMinutes())}`
				}
			},

			extractCircleId(res) {
				if (!res) return ''
				const data = res.data
				if (typeof data === 'string' || typeof data === 'number') return String(data)
				if (!data || typeof data !== 'object') return ''
				if (data.circleId) return data.circleId
				if (data.circleID) return data.circleID
				if (data.id) return data.id
				if (data.circle && data.circle.circleId) return data.circle.circleId
				return ''
			},

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
			getUserAvatarBase64(userInfo) {
				return toSubmittableImageBase64(userInfo && userInfo.image)
			},
			promptResetAvatar() {
				uni.showToast({
					title: '请重新设置头像',
					icon: 'none'
				})
				setTimeout(() => {
					uni.navigateTo({
						url: '/pages/profile/profileNew'
					})
				}, 900)
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
						console.error('获取位置失败，使用默认位置加载圈子详情：', err)
						this.loadCircleDataReal(116.24145697699653, 39.93208468967014)
					}
				})

			},

			async loadCircleDataReal(longitude, latitude) {
				try {
					this.userId = await this.userStore.getUserId()
					const res = await circleApi.getCircleDetail(this.circleId, this.userId, longitude, latitude)
					if (res.status === 10000) {
						const {
							data
						} = res
						const dateObj = this.parseCircleDate(data.activityTime) || new Date();

						// 提取日期部分，格式为 YYYY-MM-DD
						const year = dateObj.getFullYear();
						const month = pad2(dateObj.getMonth() + 1);
						const day = pad2(dateObj.getDate());
						const date = `${year}-${month}-${day}`;

						// 提取时间部分，格式为 HH:MM
						const hours = pad2(dateObj.getHours());
						const minutes = pad2(dateObj.getMinutes());
						const time = `${hours}:${minutes}`;
						this.formData = {
							circleName: data.circleName,
							introduction: data.introduction,
							location: data.activityLocation,
							latitude: data.latitude,
							longitude: data.longitude,
							activityTime: time,
							activityDate: date,
							money: data.money !== undefined && data.money !== null ? data.money.toString() : ''
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
						const locationText = res.address || res.name || ''
						this.formData.location = locationText
						this.formData.address = res.address || locationText
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
						const formatted = this.formatDateParts(futureTime)
						this.formData.activityDate = formatted.date
						this.formData.activityTime = formatted.time
						
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
						const formatted = this.formatDateParts(futureTime)

						this.formData.activityDate = formatted.date
						this.formData.activityTime = formatted.time

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
						const formatted = this.formatDateParts(futureTime)

						this.formData.activityDate = formatted.date
						this.formData.activityTime = formatted.time
						
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
				const requiredFields = [
					{ field: 'circleName', label: '圈子名称' },
					{ field: 'money', label: '预算' },
					{ field: 'introduction', label: '圈子描述' },
					{ field: 'location', label: '位置' },
					{ field: 'activityTime', label: '活动时间' },
					{ field: 'activityDate', label: '活动日期' }
				]

				for (let index = 0; index < requiredFields.length; index += 1) {
					const field = requiredFields[index].field
					const label = requiredFields[index].label
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
					let savedCircleId = this.circleId

					if (this.isEdit) {
						const ownerId = await this.userStore.getUserId()
						const ownerName = userInfo.userName
						const ownerImage = this.getUserAvatarBase64(userInfo)
						if (!ownerImage) {
							this.promptResetAvatar()
							return
						}
						const updateData = {
							circleId: this.circleId,
							...this.formData,
							ownerId,
							ownerName,
							ownerImage
						}
						const res = await circleApi.updateCircle(updateData)
						if (res.status !== 10000) {
							throw new Error(res.message || res.msg || '保存失败')
						}
						savedCircleId = this.extractCircleId(res) || savedCircleId
					} else {
						const ownerId = await this.userStore.getUserId()
						const ownerName = userInfo.userName
						const ownerImage = this.getUserAvatarBase64(userInfo)
						if (!ownerImage) {
							this.promptResetAvatar()
							return
						}
						const createData = {
							...this.formData,
							ownerImage
						}
						const res = await circleApi.createCircle(createData, ownerId, ownerName)
						if (res.status !== 10000) {
							throw new Error(res.message || res.msg || '保存失败')
						}
						savedCircleId = this.extractCircleId(res) || savedCircleId
					}

					if (savedCircleId) {
						this.circleId = savedCircleId
					}

					uni.showToast({
						title: '保存成功',
						icon: 'success'
					})

					this.circleStore.markNeedRefresh()

					const circleId = savedCircleId
					setTimeout(() => {
						const pages = getCurrentPages()
						if (circleId) {
							uni.redirectTo({
								url: `/pages/circle/detail?circleId=${circleId}`
							})
						} else if (this.isEdit && pages.length > 1) {
							uni.navigateBack()
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

<style lang="scss" scoped>
	.create-container {
		min-height: 100vh;
		padding-bottom: 112px !important;
		background:
			radial-gradient(circle at top left, rgba(255, 255, 255, 0.95), transparent 34%),
			radial-gradient(circle at bottom right, rgba(231, 200, 171, 0.72), transparent 32%),
			linear-gradient(160deg, #f7f1eb 0%, #efe2d4 46%, #ead8c6 100%) !important;
		color: #2f241d;
		box-sizing: border-box;
	}

	.create-container .nav-header {
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

	.create-container .left-btn {
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

	.create-container .header-title {
		flex: 1;
		color: #2f241d !important;
		font-size: 17px !important;
		font-weight: 900 !important;
		line-height: 1.35;
		text-align: center;
	}

	.create-container .right-placeholder {
		width: 54px !important;
	}

	.create-container .form-section {
		margin: 18px 18px 0;
		padding: 18px !important;
		border: 1px solid rgba(82, 49, 31, 0.12);
		border-radius: 22px;
		background: #fffaf5;
		box-shadow: 0 10px 24px rgba(98, 63, 36, 0.06);
	}

	.create-container .circle-header {
		margin-bottom: 18px !important;
		padding-bottom: 14px;
		border-bottom: 1px solid rgba(82, 49, 31, 0.08);
	}

	.create-container .creator-text {
		color: #6f3d1d !important;
		font-size: 15px !important;
		font-weight: 900;
		line-height: 1.45;
	}

	.create-container .form-item {
		margin-bottom: 18px !important;
	}

	.create-container .form-item:last-child {
		margin-bottom: 0 !important;
	}

	.create-container .label {
		display: block;
		margin-bottom: 8px !important;
		color: #2f241d !important;
		font-size: 14px !important;
		font-weight: 900;
		line-height: 1.4;
	}

	.create-container .required {
		color: #9c5b2e !important;
	}

	.create-container .input,
	.create-container .textarea,
	.create-container .location-picker,
	.create-container .picker {
		width: 100%;
		border: 1px solid rgba(82, 49, 31, 0.12) !important;
		border-radius: 18px !important;
		background: #ffffff !important;
		color: #2f241d !important;
		font-size: 14px !important;
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
	}

	.create-container .input,
	.create-container .picker {
		height: 48px !important;
		line-height: 48px;
		padding: 0 14px !important;
	}

	.create-container .textarea {
		min-height: 132px !important;
		padding: 12px 14px !important;
		line-height: 1.6;
	}

	.create-container .location-picker {
		min-height: 48px !important;
		padding: 10px 14px !important;
		line-height: 1.45;
	}

	.create-container .location-text,
	.create-container .picker text {
		color: #2f241d !important;
	}

	.create-container .hint {
		display: block;
		margin-top: 6px !important;
		color: #8a766a !important;
		font-size: 12px !important;
		line-height: 1.4;
	}

	.create-container .save-btn {
		position: fixed;
		right: 18px;
		bottom: 34px;
		left: 18px !important;
		width: auto !important;
		height: 48px !important;
		line-height: 48px !important;
		transform: none !important;
		border: 0 !important;
		border-radius: 18px !important;
		background: linear-gradient(135deg, #9c5b2e, #6f3d1d) !important;
		box-shadow: 0 14px 26px rgba(111, 61, 29, 0.18);
		color: #ffffff !important;
		font-size: 15px !important;
		font-weight: 900;
	}

	.create-container .save-btn::after {
		border: none;
	}

	.create-container .save-btn-disabled {
		border: 1px solid rgba(82, 49, 31, 0.1) !important;
		background: #f3eee8 !important;
		box-shadow: none;
		color: #a89a91 !important;
		opacity: 1 !important;
	}
</style>
