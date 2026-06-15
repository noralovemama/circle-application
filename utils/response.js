export const getResponseStatus = (res) => {
  if (!res || typeof res !== 'object') return undefined
  const rawStatus = res.status !== undefined && res.status !== null ? res.status : res.code
  if (rawStatus === undefined || rawStatus === null || rawStatus === '') return undefined
  const numericStatus = Number(rawStatus)
  return isNaN(numericStatus) ? rawStatus : numericStatus
}

export const isSuccessResponse = (res) => {
  const status = getResponseStatus(res)
  return status === 10000 || status === 0
}

export const getResponseMessage = (res, fallback = '请求失败') => {
  if (!res) return fallback
  if (typeof res === 'string') return res
  const data = res.data || {}
  return res.message || res.msg || data.message || data.msg || fallback
}

export const firstFilled = (...values) => {
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index]
    if (value !== undefined && value !== null && value !== '') return value
  }
  return ''
}
