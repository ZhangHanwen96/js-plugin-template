import React, { useEffect, useState } from 'react'
import clx from 'classnames'
import { useMemoizedFn, useMount } from 'ahooks'
import { usePluginStore } from '@/store'
import { Rect } from '@/interface'
import Pubsub from '@/utils/pubsub'

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
type Conditions = Record<'top' | 'left', LineCondition[]>
type LineCondition = {
  lineType: LineType
  lineShift: number
  compShift: number
  near: boolean
}

const LINE_SIZE = 1

type LineState = Record<LineType, { show: boolean; shift: number }>

export const marklinePubsub = new Pubsub()

const Marklines = () => {
  const [lineState, setLineState] = useState<LineState>({} as LineState)

  const clearLines = () => {
    setLineState({} as LineState)
  }

  const drawLines = useMemoizedFn((offsetX: number, offsetY: number) => {
    const preferTop = offsetY < 0
    const preferLeft = offsetX < 0

    const posterRect = document
      .getElementById('poster')!
      .getBoundingClientRect()

    clearLines()
    // init
    const { rectBox } = usePluginStore.getState()
    const curStyle = {
      ...rectBox,
      top: rectBox.y,
      left: rectBox.x
    } as unknown as Rect & {
      bottom: number
      right: number
      top: number
      left: number
    }
    curStyle.bottom = rectBox.y + rectBox.height
    curStyle.right = rectBox.x + rectBox.width

    const linesToPush = [] as LineCondition[]

    const componentData = [
      { top: 0, left: 0, width: posterRect.width, height: posterRect.height }
    ]

    componentData.forEach((comp) => {
      const { top, left, width, height } = comp
      const conditions: Conditions = {
        top: [
          // component - target
          // top - top
          {
            lineType: 'x-top',
            near: isNear(top, curStyle.top),
            lineShift: top,
            compShift: top
          },
          // bottom - top
          {
            lineType: 'x-top',
            near: isNear(top, curStyle.bottom),
            lineShift: top,
            compShift: top - curStyle.height
          },
          {
            lineType: 'x-center',
            near: isNear(top + height / 2, curStyle.top + curStyle.height / 2),
            lineShift: top + height / 2,
            compShift: top + height / 2 - curStyle.height / 2
          },
          // top - bottom
          {
            lineType: 'x-bottom',
            near: isNear(curStyle.top, top + height),
            compShift: top + height,
            lineShift: top + height - LINE_SIZE
          },
          // bottom - bottom
          {
            lineType: 'x-bottom',
            near: isNear(curStyle.bottom, top + height),
            compShift: top + height - curStyle.height,
            lineShift: top + height - LINE_SIZE
          }
        ],
        // left - left
        left: [
          // left - left
          {
            near: isNear(curStyle.left, left),
            compShift: left,
            lineShift: left,
            lineType: 'y-left'
          },
          // right - left
          {
            near: isNear(curStyle.right, left),
            compShift: left - curStyle.width,
            lineShift: left,
            lineType: 'y-left'
          },
          // center - center
          {
            near: isNear(curStyle.left + curStyle.width / 2, left + width / 2),
            compShift: left + width / 2 - curStyle.width / 2,
            lineShift: left + width / 2,
            lineType: 'y-center'
          },
          // left - right
          {
            near: isNear(curStyle.left, left + width),
            compShift: left + width,
            lineShift: left + width - LINE_SIZE,
            lineType: 'y-right'
          },
          // right - right
          {
            near: isNear(curStyle.right, left + width),
            compShift: left + width - curStyle.width,
            lineShift: left + width - LINE_SIZE,
            lineType: 'y-right'
          }
        ]
      }

      for (const direction of Object.keys(conditions)) {
        conditions[direction as keyof typeof conditions].forEach(
          (condition) => {
            if (
              condition.near &&
              !linesToPush.some((l) => l.lineType === condition.lineType)
            ) {
              linesToPush.push(condition)
            }
          }
        )
      }

      const allLineTypes = linesToPush.map((l) => l.lineType)

      const newLineState = {} as LineState

      const yLineTypeFisrt = preferLeft ? 'y-left' : 'y-right'
      const yLineTypeLast = preferLeft ? 'y-right' : 'y-left'
      if (allLineTypes.includes(yLineTypeFisrt)) {
        newLineState[yLineTypeFisrt] = {
          show: true,
          shift: linesToPush.find((l) => l.lineType === yLineTypeFisrt)!
            .lineShift
        }
      } else if (allLineTypes.includes('y-center')) {
        newLineState['y-center'] = {
          show: true,
          shift: linesToPush.find((l) => l.lineType === 'y-center')!.lineShift
        }
      } else if (allLineTypes.includes(yLineTypeLast)) {
        newLineState[yLineTypeLast] = {
          show: true,
          shift: linesToPush.find((l) => l.lineType === yLineTypeLast)!
            .lineShift
        }
      }

      const xLineTypeFisrt = preferTop ? 'x-top' : 'x-bottom'
      const xLineTypeLast = preferTop ? 'x-bottom' : 'x-top'
      if (allLineTypes.includes(xLineTypeFisrt)) {
        newLineState[xLineTypeFisrt] = {
          show: true,
          shift: linesToPush.find((l) => l.lineType === xLineTypeFisrt)!
            .lineShift
        }
      } else if (allLineTypes.includes('x-center')) {
        newLineState['x-center'] = {
          show: true,
          shift: linesToPush.find((l) => l.lineType === 'x-center')!.lineShift
        }
      } else if (allLineTypes.includes(xLineTypeLast)) {
        newLineState[xLineTypeLast] = {
          show: true,
          shift: linesToPush.find((l) => l.lineType === xLineTypeLast)!
            .lineShift
        }
      }

      const filteredLinesToPush = linesToPush.filter((l) => {
        return Object.keys(newLineState).includes(l.lineType)
      })

      const rect = {}

      for (const line of filteredLinesToPush) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        rect[line.lineType.includes('x') ? 'y' : 'x'] = line.compShift
      }

      usePluginStore.getState().setRectBox((preRect) => {
        return {
          ...preRect,
          ...rect
        }
      })

      setLineState(newLineState)
    })
  })

  useEffect(() => {
    marklinePubsub.subscribe('draw-line', (data) => {
      drawLines(data.offsetX, data.offsetY)
    })
    marklinePubsub.subscribe('hide-line', clearLines)
  }, [])

  return (
    <div className="markline-wrapper">
      {Object.entries(lineState).map(([line, { shift, show }]) => {
        const className = clx(
          'mark-line',
          line.includes('x') ? 'dir-x' : 'dir-y'
        )

        return show ? (
          <div
            key={line}
            className={className}
            style={{
              [line.includes('x') ? 'top' : 'left']: shift
            }}
          />
        ) : null
      })}
    </div>
  )
}

export default Marklines
