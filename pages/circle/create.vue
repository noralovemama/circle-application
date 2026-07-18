<template>
	<view class="create-container">
		<!-- 顶部导航栏 -->
		<view class="nav-header">
			<view class="left-btn" @click="goBack">返回</view>
			<text class="header-title">{{ isEdit ? '编辑圈子' : '创建圈子' }}</text>
			<view class="right-placeholder"></view>
		</view>

		<!-- 表单区域 -->
		<view class="hero-card">
			<text class="hero-eyebrow">{{ isEdit ? '编辑圈子' : '发起圈子' }}</text>
			<text class="hero-title">写清楚为什么建立这个圈子，最想做的事情是什么</text>
			<text class="hero-copy">{{ isEdit ? '把关键信息补充清楚。' : '把原因和安排写具体。' }}</text>
		</view>

		<view class="form-section">
			<view class="circle-header">
				<text class="creator-text">{{ getCreatorName() }}想和大家一起</text>
				<text class="creator-subtitle">{{ isEdit ? '更新圈子信息' : '建立圈子' }}</text>
			</view>

			<view class="form-item">
				<text class="label">圈子名称<text class="required">*</text></text>
				<input class="input" v-model="formData.circleName" @input="onFieldInput('circleName', $event)" placeholder="比如：想找人聊聊欧洲旅行计划" />
			</view>

			<view class="form-item">
				<text class="label">主题<text class="required">*</text></text>
				<input class="input" v-model="formData.theme" @input="onFieldInput('theme', $event)" placeholder="这个圈子最核心想聊什么" />
			</view>

			<view class="form-item">
				<text class="label">为什么建立这个圈子，最想做的事情是什么<text class="required">*</text></text>
				<textarea class="textarea textarea-compact" maxlength="800" v-model="formData.purpose" @input="onFieldInput('purpose', $event)" placeholder="比如：想约几个做产品和研发的人，一起聊欧洲旅行计划，看看能不能约到暑假同行的朋友" />
			</view>

			<view class="form-item">
				<text class="label">预算类型<text class="required">*</text></text>
				<view class="choice-row">
					<view
						v-for="type in budgetTypeOptions"
						:key="type"
						class="choice-chip"
						:class="{ 'choice-chip-active': formData.budgetType === type }"
						@click="selectBudgetType(type)"
					>
						{{ type }}
					</view>
				</view>
			</view>

			<view class="form-item">
				<text class="label">预算<text class="required">*</text></text>
				<input
					class="input"
					type="number"
					v-model="formData.money"
					:placeholder="formData.budgetType === '具体活动预算' ? '比如：300 元 / 人' : '比如：38 元、58 元 / 人'"
					@input="onMoneyInput"
					@blur="onMoneyBlur"
				/>
				<text class="hint">会和预算类型一起展示。</text>
			</view>

			<view class="form-item">
				<text class="label">咖啡店<text class="required">*</text></text>
				<view class="location-picker" @click="openMap">
					<text class="location-text">{{ formData.location || '选择一家真实存在的咖啡店' }}</text>
					<uni-icons type="right" size="16"></uni-icons>
				</view>
			</view>

			<view class="form-item">
				<text class="label">见面日期<text class="required">*</text></text>
				<picker mode="date" :value="formData.activityDate" :start="todayDate" @change="onActivityDateChange">
					<view class="picker">
						<text>{{ formData.activityDate || '选择日期' }}</text>
						<uni-icons type="right" size="16"></uni-icons>
					</view>
				</picker>
			</view>

			<view class="form-item">
				<text class="label">见面时间<text class="required">*</text></text>
				<picker mode="time" :value="formData.activityTime" :start="getMinTime()" @change="onActivityTimeChange">
					<view class="picker">
						<text>{{ formData.activityTime || '选择时间' }}</text>
						<uni-icons type="right" size="16"></uni-icons>
					</view>
				</picker>
			</view>
		</view>

		<!-- 保存按钮 -->
		<button class="save-btn" :class="{ 'save-btn-disabled': isSaving }" @click="saveCircle" :disabled="isSaving">{{ isSaving ? '保存中...' : (isEdit ? '更新圈子' : '发布圈子') }}</button>

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

	const BUDGET_TYPE_OPTIONS = ['咖啡预算', '具体活动预算']

	function mergePurpose(reason = '', goal = '') {
		return [reason, goal].map(item => String(item || '').trim()).filter(Boolean).join('\n')
	}

	function buildStructuredIntroduction({ theme = '', purpose = '' } = {}) {
		return [
			`主题：${theme}`,
			`为什么建立这个圈子，最想做的事情是什么：${purpose}`
		].join('\n')
	}

	function parseStructuredIntroduction(introduction = '') {
		const text = String(introduction || '').trim()
		if (!text) {
			return {
				theme: '',
				purpose: ''
			}
		}

		const getField = (label) => {
			const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
			const reg = new RegExp(`${escapedLabel}：([\\s\\S]*?)(?:\\n(?:主题|为什么建立这个圈子，最想做的事情是什么|为什么要建立这个圈子|最想做的事情)：|$)`)
			const match = text.match(reg)
			return match && match[1] ? match[1].trim() : ''
		}

		const theme = getField('主题')
		const purpose = getField('为什么建立这个圈子，最想做的事情是什么')
		const reason = getField('为什么要建立这个圈子')
		const goal = getField('最想做的事情')

		if (theme || purpose || reason || goal) {
			return {
				theme,
				purpose: purpose || mergePurpose(reason, goal)
			}
		}

		return {
			theme: '',
			purpose: text
		}
	}

	export default {
		data() {
			return {
				circleId: '',
				userId: '',
				isEdit: false,
				formData: {
					circleName: '',
					theme: '',
					purpose: '',
					budgetType: '咖啡预算',
					money: '',
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
				budgetTypeOptions: BUDGET_TYPE_OPTIONS,
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

			selectBudgetType(type) {
				this.formData.budgetType = type
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
					const isLoggedIn = await this.userStore.checkLoginStatus()
					if (!isLoggedIn) {
						return false
					}

					// 确保用户信息完整
					await this.userStore.ensureUserInfo()

					// 验证用户信息是否完整
					const userInfo = this.userStore.userInfo
					if (!userInfo.userName || !userInfo.image) {
						uni.showToast({
							title: '先把你的资料补完整，再来发起小局',
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
						title: '你的资料暂时没加载出来',
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
					title: '头像需要重新选一次',
					icon: 'none'
				})
				setTimeout(() => {
					uni.navigateTo({
						url: '/pages/profile/profileNew'
					})
				}, 900)
			},
			async loadCircleData() {
				uni.getLocation({
					type: 'gcj02',
					success: async ({
						longitude,
						latitude
					}) => {
						await this.loadCircleDataReal(longitude, latitude)
					},
					fail: (err) => {
						console.error('获取位置失败，按无定位参数加载真实圈子详情：', err)
						uni.showToast({
							title: '未获取到定位，先加载真实详情',
							icon: 'none'
						})
						this.loadCircleDataReal('', '')
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
						const parsedIntroduction = parseStructuredIntroduction(data.introduction)
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
							theme: parsedIntroduction.theme || data.slogan || '',
							purpose: parsedIntroduction.purpose || '',
							budgetType: this.budgetTypeOptions.includes(data.topic) ? data.topic : '咖啡预算',
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
						title: '圈子信息暂时没加载出来',
						icon: 'none'
					})
				}

			},

			openMap() {
				uni.chooseLocation({
					success: (res) => {
						console.info('选择位置：', res)
						const locationText = res.name || res.address || ''
						this.formData.location = locationText
						this.formData.address = res.address || locationText
						this.formData.latitude = res.latitude
						this.formData.longitude = res.longitude
					},
					fail: (err) => {
						console.error('选择位置失败：', err)
						uni.showToast({
							title: '没有选到地点',
							icon: 'none'
						})
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
						title: '先把预算补上',
						icon: 'none',
						duration: 1500
					})
					return
				}
				
				// 验证是否为有效数字
				const numValue = parseInt(value)
				if (isNaN(numValue) || numValue <= 0) {
					uni.showToast({
						title: '预算要大于 0 元',
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
							title: '时间已经顺延到 1 小时后',
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
							title: '刚刚选到过去时间了，已经帮你往后顺延',
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
							title: '时间帮你调整过了',
							content: '原来的活动时间已经过去了，我先帮你顺延到 1 小时后，你也可以再改成更合适的时间。',
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
					{ field: 'theme', label: '主题' },
					{ field: 'purpose', label: '为什么建立这个圈子，最想做的事情是什么' },
					{ field: 'budgetType', label: '预算类型' },
					{ field: 'money', label: '预算' },
					{ field: 'location', label: '咖啡店' },
					{ field: 'activityTime', label: '时间' },
					{ field: 'activityDate', label: '日期' }
				]

				for (let index = 0; index < requiredFields.length; index += 1) {
					const field = requiredFields[index].field
					const label = requiredFields[index].label
					if (!this.formData[field]) {
						uni.showToast({
							title: `先补上${label}`,
							icon: 'none'
						})
						return
					}
				}
				
				// 验证money是否为有效的非负整数且不为空
				if (!this.formData.money || this.formData.money.trim() === '') {
					uni.showToast({
						title: '先把预算补上',
						icon: 'none'
					})
					return
				}
				
				const moneyValue = parseInt(this.formData.money)
				if (isNaN(moneyValue) || moneyValue <= 0) {
					uni.showToast({
						title: '预算要大于 0 元',
						icon: 'none'
					})
					return
				}
				
				// 验证活动日期时间不能是过去
				const activityDateTime = new Date(`${this.formData.activityDate}T${this.formData.activityTime}:00`)
				const now = new Date()
				
				if (activityDateTime <= now) {
					uni.showToast({
						title: '活动时间要晚于现在',
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
					const introduction = buildStructuredIntroduction(this.formData)
					const slogan = this.formData.theme

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
							introduction,
							slogan,
							topic: this.formData.budgetType,
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
							introduction,
							slogan,
							topic: this.formData.budgetType,
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
						title: '圈子已经保存好了',
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
						title: error.message || '圈子还没保存成功',
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
		padding-bottom: 112px !important;
		background:
			radial-gradient(circle at top left, rgba(255, 255, 255, 0.95), transparent 34%),
			radial-gradient(circle at bottom right, rgba(216, 194, 174, 0.68), transparent 34%),
			linear-gradient(160deg, #f7f3ee 0%, #efe4d8 48%, #e6d7c8 100%) !important;
		color: #30261f;
		box-sizing: border-box;
	}

	.create-container .nav-header {
		position: sticky;
		top: 0;
		z-index: 10;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: calc(var(--status-bar-height) + 10px) 16px 12px !important;
		border-bottom: 1px solid rgba(82, 49, 31, 0.1);
		background: rgba(255, 250, 245, 0.88) !important;
		color: #30261f !important;
		backdrop-filter: blur(18px);
	}

	.create-container .left-btn {
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

	.create-container .header-title {
		flex: 1;
		color: #30261f !important;
		font-size: 17px !important;
		font-weight: 800 !important;
		line-height: 30px;
		text-align: center;
		letter-spacing: -0.2px;
	}

	.create-container .right-placeholder {
		width: 52px !important;
	}

	.create-container .form-section {
		margin: 20px 20px 0;
		padding: 20px !important;
		border: 1px solid rgba(82, 49, 31, 0.12);
		border-radius: 22px;
		background: #fffaf5;
		box-shadow: 0 10px 24px rgba(103, 77, 58, 0.06);
	}

	.create-container .hero-card {
		margin: 20px 20px 0;
		padding: 24px 20px;
		border-radius: 24px;
		background:
			radial-gradient(circle at top right, rgba(255, 255, 255, 0.34), transparent 30%),
			linear-gradient(135deg, #8d6b53 0%, #a88569 56%, #c6a68d 100%);
		box-shadow: 0 18px 35px rgba(111, 84, 63, 0.2);
		color: #fffaf6;
	}

	.create-container .hero-eyebrow {
		display: inline-flex;
		align-items: center;
		padding: 7px 10px;
		margin-bottom: 14px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.16);
		font-size: 11px;
		font-weight: 800;
		letter-spacing: 1px;
	}

	.create-container .hero-title {
		display: block;
		font-size: 24px;
		font-weight: 900;
		line-height: 32px;
		letter-spacing: -0.4px;
	}

	.create-container .hero-copy {
		display: block;
		margin-top: 10px;
		font-size: 14px;
		line-height: 22px;
		color: rgba(255, 250, 246, 0.86);
	}

	.create-container .circle-header {
		margin-bottom: 20px !important;
		padding-bottom: 16px;
		border-bottom: 1px solid rgba(82, 49, 31, 0.08);
	}

	.create-container .creator-text {
		display: block;
		color: #7b5f48 !important;
		font-size: 18px !important;
		font-weight: 900;
		line-height: 26px;
	}

	.create-container .creator-subtitle {
		display: block;
		margin-top: 6px;
		color: #7d6a5c !important;
		font-size: 13px !important;
		line-height: 20px;
	}

	.create-container .form-item {
		margin-bottom: 22px !important;
	}

	.create-container .form-item:last-child {
		margin-bottom: 0 !important;
	}

	.create-container .label {
		display: block;
		margin-bottom: 10px !important;
		color: #30261f !important;
		font-size: 15px !important;
		font-weight: 900;
		line-height: 22px;
	}

	.create-container .required {
		color: #8c664c !important;
	}

	.create-container .input,
	.create-container .textarea,
	.create-container .location-picker,
	.create-container .picker {
		width: 100%;
		border: 1px solid rgba(82, 49, 31, 0.12) !important;
		border-radius: 18px !important;
		background: #ffffff !important;
		color: #30261f !important;
		font-size: 14px !important;
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
	}

	.create-container .input,
	.create-container .picker {
		height: 48px !important;
		line-height: 48px;
		padding: 0 16px !important;
		font-size: 15px !important;
		font-weight: 600;
	}

	.create-container .textarea {
		min-height: 136px !important;
		padding: 14px 16px !important;
		font-size: 15px !important;
		font-weight: 500;
		line-height: 24px;
	}

	.create-container .textarea-compact {
		min-height: 108px !important;
	}

	.create-container .location-picker {
		min-height: 48px !important;
		padding: 12px 16px !important;
		line-height: 24px;
	}

	.create-container .location-text,
	.create-container .picker text {
		color: #30261f !important;
	}

	.create-container .hint {
		display: block;
		margin-top: 6px !important;
		color: #7d6a5c !important;
		font-size: 13px !important;
		line-height: 20px;
	}

	.create-container .choice-row {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}

	.create-container .choice-chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 42px;
		padding: 0 16px;
		border: 1px solid rgba(82, 49, 31, 0.12);
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.92);
		color: #7d6a5c;
		font-size: 14px;
		font-weight: 800;
		line-height: 20px;
	}

	.create-container .choice-chip-active {
		border-color: rgba(111, 61, 29, 0.18);
		background: #7b5f48;
		color: #fffaf6;
		box-shadow: 0 12px 24px rgba(94, 70, 52, 0.14);
	}

	.create-container .save-btn {
		position: fixed;
		right: 20px;
		bottom: 34px;
		left: 20px !important;
		width: auto !important;
		height: 48px !important;
		line-height: 48px !important;
		transform: none !important;
		border: 0 !important;
		border-radius: 18px !important;
		background: linear-gradient(135deg, #8c664c 0%, #72513b 100%) !important;
		box-shadow: 0 14px 26px rgba(94, 70, 52, 0.18);
		color: #ffffff !important;
		font-size: 15px !important;
		font-weight: 900;
	}

	.create-container .save-btn::after {
		border: none;
	}

	.create-container .save-btn-disabled {
		border: 1px solid rgba(82, 49, 31, 0.1) !important;
		background: #efe7df !important;
		box-shadow: none;
		color: #ad9d90 !important;
		opacity: 1 !important;
	}
</style>
