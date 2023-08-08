import { Rect } from '@/interface'

export const toFixed2 = (num: number, precision = 2) => {
  return Number(num.toFixed(precision))
}

/**
 * @description transform absolute position to percent position
 *
 */
export const absolutePositionToPercent = (
  targetRect: Rect,
  containerRect: Rect
) => {
  const leftP = toFixed2(targetRect.x / containerRect.width, 3)
  const topP = toFixed2(targetRect.y / containerRect.height, 3)
  const widthP = toFixed2(targetRect.width / containerRect.width, 3)
  const heightP = toFixed2(targetRect.height / containerRect.height, 3)
  return {
    x: leftP,
    y: topP,
    width: widthP,
    height: heightP
  }
}

export const percentPositionToAbsolute = (
  targetRect: Rect,
  containerRect: Rect
) => {
  const left = toFixed2(targetRect.x * containerRect.width)
  const top = toFixed2(targetRect.y * containerRect.height)
  const width = toFixed2(targetRect.width * containerRect.width)
  const height = toFixed2(targetRect.height * containerRect.height)
  return {
    x: left,
    y: top,
    width,
    height
  }
}
