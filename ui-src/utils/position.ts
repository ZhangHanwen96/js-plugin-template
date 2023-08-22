import { rectBoxRef } from '@/store'
import { Rect } from '@/interface'
import { useExtraStore } from '@/store/extra'

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

// export const getBoxselectPercentageRect = () => {
//   const { boxSelectDivStyle: rect } = useExtraStore.getState()
//   if (!rect) return
//   // const right = Math.min(
//   //   rect.x + rect.width,
//   //   rectBoxRef.current.x + rectBoxRef.current.width
//   // )
//   // const bottom = Math.min(
//   //   rect.y + rect.height,
//   //   rectBoxRef.current.height + rectBoxRef.current.y
//   // )
//   // const left = Math.max(rect.x, rectBoxRef.current.x)
//   // const top = Math.max(rect.y, rectBoxRef.current.y)
//   // const intersectionRect = {
//   //   x: left,
//   //   y: top,
//   //   width: right - left,
//   //   height: bottom - top
//   // }

//   // const relativeIntersectionRectToImage = {
//   //   ...intersectionRect,
//   //   x: intersectionRect.x - rectBoxRef.current.x,
//   //   y: intersectionRect.y - rectBoxRef.current.y
//   // }

//   // const percentageRect = absolutePositionToPercent(
//   //   relativeIntersectionRectToImage,
//   //   {
//   //     x: 0,
//   //     y: 0,
//   //     width: rectBoxRef.current.width,
//   //     height: rectBoxRef.current.height
//   //   }
//   // )
//   // return percentageRect
// }
