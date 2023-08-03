import { Rect } from '@/interface'

/**
 * @description transform absolute position to percent position
 *
 */
export const absolutePositionToPercent = (
  targetRect: Rect,
  containerRect: Rect
) => {
  const leftP = targetRect.x / containerRect.width
  const topP = targetRect.y / containerRect.height
  const widthP = targetRect.width / containerRect.width
  const heightP = targetRect.height / containerRect.height
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
  const left = targetRect.x * containerRect.width
  const top = targetRect.y * containerRect.height
  const width = targetRect.width * containerRect.width
  const height = targetRect.height * containerRect.height
  return {
    x: left,
    y: top,
    width,
    height
  }
}
