import request from '@/utils/request'

export const createCircle = async (data) => {
  return request({
    url: 'circle/update',
    method: 'POST',
    data
  })
}
