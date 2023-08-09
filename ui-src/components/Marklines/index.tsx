import React, { useEffect, useState } from 'react'
import clx from 'classnames'
import { useMemoizedFn, useSize } from 'ahooks'
import { usePluginStore } from '@/store'
import { Rect } from '@/interface'
import Pubsub from '@/utils/pubsub'
import { clamp } from 'lodash'

type LineType =
  | 'x-top'
  | 'x-center'
  | 'x-bottom'
  | 'y-left'
  | 'y-center'
  | 'y-right'

const DIFF = 3

const offset = (x: number | string, y: number | string) => {
  return Math.abs(Number(x) - Number(y))
}

const isNear = (x: number | string, y: number | string) => {
  return offset(x, y) <= DIFF
}

const LINE_SIZE = 1

type LineCords = {
  x1: number
  x2: number
  y1: number
  y2: number
  pos: 'x' | 'y'
}

export const marklinePubsub = new Pubsub()

const Marklines = () => {
  const [lines, setLines] = useState<LineCords[]>([])

  const posterRect = useSize(() => {
    return document.getElementById('poster')
  })

  const clearLines = () => {
    setLines([])
  }

  const drawLines = useMemoizedFn(() => {
    const posterRect = document
      .getElementById('poster')!
      .getBoundingClientRect()

    clearLines()
    // init
    const { rectBox } = usePluginStore.getState()
    const curStyle = {
      ...rectBox,
      top: rectBox.y,
      left: rectBox.x,
      centerX: rectBox.x + rectBox.width / 2,
      centerY: rectBox.y + rectBox.height / 2,
      bottom: rectBox.y + rectBox.height,
      right: rectBox.x + rectBox.width
    } as unknown as Rect & {
      bottom: number
      right: number
      top: number
      left: number
      centerX: number
      centerY: number
    }

    const sourcePosSpaceMap: Record<
      string,
      {
        space: number
        line: { x1: number; x2: number; y1: number; y2: number; pos: 'x' | 'y' }
      }
    > = {}

    const rectLeft = curStyle.x
    const rectRight = curStyle.right
    const rectTop = curStyle.top
    const rectBottom = curStyle.bottom
    const rectCenterX = (rectLeft + rectRight) / 2
    const rectCenterY = (rectTop + rectBottom) / 2

    let dx: number
    let dy: number

    const componentData = [
      {
        top: 0,
        left: 0,
        width: posterRect.width,
        height: posterRect.height
      }
    ]

    componentData.forEach((comp) => {
      const { top, left, width, height } = comp
      const centerX = left + width / 2
      const centerY = top + height / 2
      const right = left + width
      const bottom = top + height

      const array = [
        { pos: 'x', sourcePos: 'left', source: rectLeft, target: left },
        { pos: 'x', sourcePos: 'left', source: rectLeft, target: centerX },
        { pos: 'x', sourcePos: 'left', source: rectLeft, target: right },

        { pos: 'x', sourcePos: 'centerX', source: rectCenterX, target: left },
        {
          pos: 'x',
          sourcePos: 'centerX',
          source: rectCenterX,
          target: centerX
        },
        { pos: 'x', sourcePos: 'centerX', source: rectCenterX, target: right },

        { pos: 'x', sourcePos: 'right', source: rectRight, target: left },
        { pos: 'x', sourcePos: 'right', source: rectRight, target: centerX },
        { pos: 'x', sourcePos: 'right', source: rectRight, target: right },

        { pos: 'y', sourcePos: 'top', source: rectTop, target: top },
        { pos: 'y', sourcePos: 'top', source: rectTop, target: centerY },
        { pos: 'y', sourcePos: 'top', source: rectTop, target: bottom },

        { pos: 'y', sourcePos: 'centerY', source: rectCenterY, target: top },
        {
          pos: 'y',
          sourcePos: 'centerY',
          source: rectCenterY,
          target: centerY
        },
        { pos: 'y', sourcePos: 'centerY', source: rectCenterY, target: bottom },

        { pos: 'y', sourcePos: 'bottom', source: rectBottom, target: top },
        { pos: 'y', sourcePos: 'bottom', source: rectBottom, target: centerY },
        { pos: 'y', sourcePos: 'bottom', source: rectBottom, target: bottom }
      ]

      const minX = Math.min(left, rectLeft)
      const maxX = Math.max(right, rectRight)
      const minY = Math.min(top, rectTop)
      const maxY = Math.max(bottom, rectBottom)

      array.forEach(({ pos, source, sourcePos, target }) => {
        if (isNear(source, target)) {
          const space = target - source
          if (
            !sourcePosSpaceMap[sourcePos] ||
            Math.abs(sourcePosSpaceMap[sourcePos].space) > Math.abs(space)
          ) {
            if (pos === 'x') {
              dx = space
            } else {
              dy = space
            }
            sourcePosSpaceMap[sourcePos] = {
              space,
              line: {
                x1: pos === 'x' ? target : minX,
                x2: pos === 'x' ? target : maxX,
                y1: pos === 'y' ? target : minY,
                y2: pos === 'y' ? target : maxY,
                pos: pos as 'x' | 'y'
              }
            }
          }
        }
      })
    })

    if (dx || dy) {
      usePluginStore.getState().setRectBox((preRect) => {
        return {
          ...preRect,
          x: preRect.x + (dx || 0),
          y: preRect.y + (dy || 0)
        }
      })
    }

    const lines = Object.values(sourcePosSpaceMap).map((e) => e.line)
    setLines(lines)
  })

  useEffect(() => {
    marklinePubsub.subscribe('draw-line', () => {
      drawLines()
    })
    marklinePubsub.subscribe('hide-line', clearLines)
  }, [])

  const getRect = (cords: LineCords) => {
    const { x1, x2, y1, y2, pos } = cords
    if (pos === 'x') {
      return {
        left: clamp(x1, 0, posterRect.width - LINE_SIZE),
        top: y1,
        width: LINE_SIZE,
        height: y2 - y1
      }
    } else {
      return {
        left: x1,
        top: clamp(y1, 0, posterRect.height - LINE_SIZE),
        width: x2 - x1,
        height: LINE_SIZE
      }
    }
  }

  return (
    <div className="markline-wrapper">
      {lines.map((cords, index) => {
        return (
          <div
            key={index}
            className={clx('mark-line')}
            style={{
              ...getRect(cords)
            }}
          ></div>
        )
      })}
    </div>
  )
}

export default Marklines
