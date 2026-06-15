const DATA_URL_IMAGE_RE = /^data:image\/[^;]+;base64,/

export const pad2 = (value) => {
  const stringValue = String(value)
  return stringValue.length >= 2 ? stringValue : `0${stringValue}`
}

export const isDataUrlImage = (value) => DATA_URL_IMAGE_RE.test(String(value || ''))

export const isRemoteImageUrl = (value) => /^https?:\/\//.test(String(value || ''))

export const isLocalImagePath = (value) => {
  const image = String(value || '')
  return image.indexOf('wxfile://') === 0 || image.indexOf('file://') === 0 || /^https?:\/\/tmp\//.test(image)
}

export const isRelativeImagePath = (value) => {
  const image = String(value || '').split('?')[0]
  return /\.(png|jpe?g|webp|gif)$/i.test(image)
}

export const stripDataUrlPrefix = (value) => {
  const image = String(value || '').trim()
  if (!image) return ''
  return image.replace(DATA_URL_IMAGE_RE, '')
}

export const toSubmittableImageBase64 = (value) => {
  const image = stripDataUrlPrefix(value)
  if (!image) return ''
  if (isLocalImagePath(image) || isRemoteImageUrl(image) || isRelativeImagePath(image)) return ''
  return image
}

export const normalizeImageForDisplay = (value, fallback = '') => {
  const image = String(value || '').trim()
  if (!image) return fallback
  if (isDataUrlImage(image) || isRemoteImageUrl(image) || isLocalImagePath(image) || isRelativeImagePath(image)) return image
  return `data:image/png;base64,${image}`
}
