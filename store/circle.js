import { defineStore } from 'pinia'
import { circleApi } from '@/request/api'

export const useCircleStore = defineStore('circle', {
  state: () => ({
    list: [],
    pagination: {
      current: 1,
      size: 10,
      total: 0,
      hasMore: true
    },
    loading: false,
    refreshing: false,
    error: null,
    needRefresh: false  // 标记是否需要刷新数据
  }),

  actions: {
    mergeUniqueCircles(existingList = [], incomingList = []) {
      const mergedMap = new Map()
      const appendItem = (item) => {
        if (!item || typeof item !== 'object') return
        const key = item.circleId || item.circleID || item.id
        if (!key) return
        const previous = mergedMap.get(String(key)) || {}
        mergedMap.set(String(key), {
          ...previous,
          ...item
        })
      }

      existingList.forEach(appendItem)
      incomingList.forEach(appendItem)
      return Array.from(mergedMap.values())
    },

    async hydrateCircleList(records = [], { userId = '', longitude = '', latitude = '' } = {}) {
      if (!Array.isArray(records) || records.length === 0) return

      const detailResults = await Promise.all(records.map(async (item) => {
        const circleId = item && (item.circleId || item.circleID || item.id)
        if (!circleId) return item
        try {
          const res = await circleApi.getCircleDetail(circleId, userId, longitude, latitude)
          if (res && res.status === 10000 && res.data) {
            return {
              ...item,
              ...res.data,
              circleUserItemList: res.data.circleUserItemList || res.data.userList || res.data.members || item.circleUserItemList || []
            }
          }
        } catch (error) {
          console.log('[Store] 详情补全失败，保留列表数据:', circleId, error && error.message ? error.message : error)
        }
        return item
      }))

      this.list = this.mergeUniqueCircles(this.list, detailResults)
    },

    // 重置状态
    reset() {
      this.list = []
      this.pagination = {
        current: 1,
        size: 10,
        total: 0,
        hasMore: true
      }
      this.error = null
    },
    
    // 标记需要刷新
    markNeedRefresh() {
      this.needRefresh = true
    },
    
    // 清除刷新标记
    clearNeedRefresh() {
      this.needRefresh = false
    },

    // 获取圈子列表
    async getCircleList({isRefresh = false, longitude, latitude, userId, flag}) {
      console.log('[Store] 开始获取列表:', {
        isRefresh,
        currentState: { ...this.pagination },
        listLength: this.list.length,
      })

      // 防止重复请求
      if (isRefresh) {
        if (this.refreshing) return
        this.refreshing = true
        this.reset()
      } else {
        if (this.loading || !this.pagination.hasMore) {
          console.log('[Store] 跳过请求:', { loading: this.loading, hasMore: this.pagination.hasMore })
          return
        }
        this.loading = true
      }

      try {
        let params = {
          current: this.pagination.current,
          size: this.pagination.size,
          longitude, 
          latitude,
          flag
        }
		if (userId){
			params['userId']=userId
		}
        console.log('[Store] 请求参数:', params)

        const res = await circleApi.getCircleList(params)
        console.log('[Store] 请求响应:', res)

        if (res && res.status === 10000 && res.data) {
          const responseData = res.data || {}
          const records = responseData.circlePageItemList || responseData.records || responseData.list || []

          if (!Array.isArray(records)) {
            throw new Error('圈子列表数据格式错误')
          }

          const hasTotal = responseData.total !== undefined && responseData.total !== null
          const totalValue = hasTotal ? responseData.total : this.pagination.total
          const sizeValue = responseData.size !== undefined && responseData.size !== null ? responseData.size : records.length
          const currentValue = responseData.current !== undefined && responseData.current !== null ? responseData.current : 1
          const total = Number(totalValue)
          const size = Number(sizeValue)
          const current = Number(currentValue)

          // 更新列表数据
          if (isRefresh) {
            this.list = this.mergeUniqueCircles([], records)
          } else {
            // 接口可能会重复返回上一页数据，这里按 circleId 去重合并
            this.list = this.mergeUniqueCircles(this.list, records)
          }
          this.error = null

          await this.hydrateCircleList(records, { userId, longitude, latitude })
          
          // 更新分页信息
          const hasMore = size > 0 && (hasTotal ? current * size < total : records.length >= size)
          this.pagination = {
            current: hasMore ? current + 1 : current,
            size: size || records.length,
            total: hasTotal ? total : this.list.length,
            hasMore
          }

          console.log('[Store] 更新后的状态:', {
            listLength: this.list.length,
            pagination: { ...this.pagination }
          })
        } else {
          throw new Error((res && (res.message || res.msg)) || '获取圈子列表失败')
        }
      } catch (error) {
        console.error('[Store] 请求失败:', error)
        this.error = (error && error.message) || '获取圈子列表失败'
      } finally {
        this.loading = false
        this.refreshing = false
        console.log('[Store] 请求完成:', {
          loading: this.loading,
          refreshing: this.refreshing,
          listLength: this.list.length,
          pagination: { ...this.pagination }
        })
      }
    }
  }
})
