import clamp from 'lodash/clamp'

export const MIN_SIZE = 512
export const MAX_SIZE = 2048

export const rescaleRect = (width: number, height: number) => {
  const tooSmall = width < MIN_SIZE || height < MIN_SIZE
  const tooLarge = width > MAX_SIZE || height > MAX_SIZE
  const shouldRescale = tooSmall || tooLarge
  if (!shouldRescale) {
    return { width, height, scale: 1 }
  }
  if (tooSmall) {
    const scaleRatio = MIN_SIZE / Math.min(width, height)
    return {
      width: clamp(width * scaleRatio, MIN_SIZE, MAX_SIZE),
      height: clamp(height * scaleRatio, MIN_SIZE, MAX_SIZE),
      scale: scaleRatio
    }
  }
  const scaleRatio = MAX_SIZE / Math.max(width, height)
  return {
    width: clamp(width * scaleRatio, MIN_SIZE, MAX_SIZE),
    height: clamp(height * scaleRatio, MIN_SIZE, MAX_SIZE),
    scale: scaleRatio
  }
}
