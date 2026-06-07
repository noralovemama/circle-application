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
          // current: this.pagination.current,
          // size: this.pagination.size,
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

        if (res?.status === 10000 && res.data) {
          const responseData = res.data || {}
          const records = responseData.circlePageItemList || responseData.records || responseData.list || []

          if (!Array.isArray(records)) {
            throw new Error('圈子列表数据格式错误')
          }

          const total = Number(responseData.total ?? records.length)
          const size = Number(responseData.size ?? records.length)
          const current = Number(responseData.current ?? 1)

          // 更新列表数据
          if (isRefresh) {
            this.list = records
          } else {
            // 使用新数组更新，确保视图更新
            this.list = [...this.list, ...records]
          }
          this.error = null
          
          // 更新分页信息
          const hasMore = size > 0 && current * size < total
          this.pagination = {
            current: hasMore ? current + 1 : current,
            size: size || records.length,
            total: total || records.length,
            hasMore
          }

          console.log('[Store] 更新后的状态:', {
            listLength: this.list.length,
            pagination: { ...this.pagination }
          })
        } else {
          throw new Error(res?.message || res?.msg || '获取圈子列表失败')
        }
      } catch (error) {
        console.error('[Store] 请求失败:', error)
        this.error = error?.message || '获取圈子列表失败'
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