import React, { useRef, useState } from 'react'
import { useMemoizedFn, useMount } from 'ahooks'
import { usePluginStore } from '../../store'
import clx from 'classnames'

let isMoving = false
let isResizing = false

let startOrigin = {
  x: 0,
  y: 0
}
interface Rect {
  x: number
  y: number
  height: number
  width: number
}

const DEFAULT_INSET = {
  left: 0,
  top: 0,
  right: 0,
  bottom: 0
}

let lastRect: any

/**
 * @description transform absolute position to percent position
 *
 */
const absolutePositionToPercent = (targetRect: Rect, containerRect: Rect) => {
  const leftP = targetRect.x / containerRect.width
  const topP = targetRect.y / containerRect.height
  const widthP = targetRect.width / containerRect.width
  const heightP = targetRect.height / containerRect.height
  return {
    left: leftP,
    top: topP,
    width: widthP,
    height: heightP
  }
}

const percentPositionToAbsolute = (targetRect: Rect, containerRect: Rect) => {
  const left = targetRect.x * containerRect.width
  const top = targetRect.y * containerRect.height
  const width = targetRect.width * containerRect.width
  const height = targetRect.height * containerRect.height
  return {
    left,
    top,
    width,
    height
  }
}

// plugin -> absolutePositionToPercent(targetRect, pluginContainerRect)
// -> percentPositionToAbsolute(targetRect, editorContainerRect) -> editor

const Background = () => {
  const posterBgRef = useRef<HTMLDivElement>(null)
  const rectWrapperRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  //   const scale = usePluginStore.use.scale()
  const [rectBox, setRectBox] = useState<Rect>({
    x: 50,
    y: 100,
    height: 80,
    width: 150
  })

  const [inset, setInset] = useState<typeof DEFAULT_INSET>(DEFAULT_INSET)
  const insetRef = useRef<typeof DEFAULT_INSET>()
  insetRef.current = inset
  const positionRef = useRef<Rect>(rectBox)

  const handleWrapperMouseDown = useMemoizedFn(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      isMoving = true
      startOrigin = {
        x: e.clientX,
        y: e.clientY
      }
      bindEvents()

      function wrapperMove(e: MouseEvent) {
        if (!isMoving || !rectWrapperRef.current) return
        const { clientX, clientY } = e

        const offset = {
          x: clientX - startOrigin.x,
          y: clientY - startOrigin.y
        }

        setRectBox((pre) => ({
          ...pre,
          x: positionRef.current.x + offset.x,
          y: positionRef.current.y + offset.y
        }))
      }

      function wrapperMouseUp(e: MouseEvent) {
        isMoving = false
        const { clientX, clientY } = e
        const offset = {
          x: clientX - startOrigin.x,
          y: clientY - startOrigin.y
        }
        positionRef.current = {
          x: positionRef.current.x + offset.x,
          y: positionRef.current.y + offset.y,
          height: positionRef.current.height,
          width: positionRef.current.width
        }

        unbindEvents()
      }

      function unbindEvents() {
        document.removeEventListener('mousemove', wrapperMove)
        document.removeEventListener('mouseup', wrapperMouseUp)
      }

      function bindEvents() {
        document.addEventListener('mousemove', wrapperMove)
        document.addEventListener('mouseup', wrapperMouseUp)
      }
    }
  )

  useMount(() => {
    if (!posterBgRef.current) return
    const rect = posterBgRef.current.getBoundingClientRect()
    usePluginStore
      .getState()
      .calculateScale({ height: rect.height, width: rect.width })
  })

  const handleResize = useMemoizedFn(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>, dir) => {
      if (!rectWrapperRef.current || !imageRef.current || !posterBgRef.current)
        return
      e.preventDefault()
      e.stopPropagation()
      e.nativeEvent.preventDefault()
      e.nativeEvent.stopPropagation()

      const startPoint = {
        x: e.clientX,
        y: e.clientY
      }

      const imageRect = imageRef.current.getBoundingClientRect()
      const posterRect = posterBgRef.current.getBoundingClientRect()

      isResizing = true

      const onMove = (e: MouseEvent) => {
        if (
          !rectWrapperRef.current ||
          !imageRef.current ||
          !posterBgRef.current ||
          !isResizing
        )
          return

        const newInset: any = {}
        const { clientX, clientY } = e
        const wrapperRectInfo = rectWrapperRef.current.getBoundingClientRect()

        const clampedX = Math.max(
          posterRect.x,
          Math.min(clientX, posterRect.right)
        )

        const clampedY = Math.max(
          posterRect.y,
          Math.min(clientY, posterRect.bottom)
        )

        const offset = {
          x: clampedX - startPoint.x,
          y: clampedY - startPoint.y
        }

        let newRect: Rect = {} as any
        const __rect = {} as Rect & { deltaX?: number; deltaY?: number }
        const relativeImageRect: Omit<DOMRect, 'toJSON'> = {
          x: imageRect.x - posterRect.x,
          y: imageRect.y - posterRect.y,
          width: imageRect.width,
          height: imageRect.height,
          right: imageRect.right - posterRect.x,
          bottom: imageRect.bottom - posterRect.y,
          left: imageRect.left - posterRect.x,
          top: imageRect.top - posterRect.y
        }

        // 判断是否超出边界
        switch (dir) {
          case 'top':
            //                 -------- posterRect
            // ----------------|
            // -------------   |
            // |           |------wrapperRect
            // |   |----|  |   |
            // |   |    |--|------- imageRect
            // |   |----|  |   |
            // |           |   |
            // -------------   |
            // ----------------|

            if (clientY < posterRect.y || clientY > imageRect.top) {
              if (clientY < posterRect.y) {
                const height =
                  positionRef.current.height + positionRef.current.y
                __rect.y = 0
                __rect.height = height
              } else {
                __rect.height =
                  positionRef.current.y +
                  positionRef.current.height -
                  relativeImageRect.top
                __rect.y = relativeImageRect.top
              }
            }
            break
          case 'right':
            if (clientX > posterRect.right) {
              __rect.width = posterRect.width - positionRef.current.x
            } else if (clientX < imageRect.right) {
              __rect.width = relativeImageRect.right - positionRef.current.x
            }

            break
          case 'bottom':
            if (clientY > posterRect.bottom || clientY < imageRect.bottom) {
              if (clientY > posterRect.bottom) {
                __rect.height = posterRect.height - positionRef.current.y
              } else {
                __rect.height = relativeImageRect.bottom - positionRef.current.y
              }
            }
            break
          case 'left':
            if (clientX < posterRect.x || clientX > imageRect.left) {
              if (clientX < posterRect.x) {
                __rect.x = 0
                __rect.width = positionRef.current.x + positionRef.current.width
              } else {
                __rect.x = relativeImageRect.left
                __rect.width =
                  positionRef.current.x +
                  positionRef.current.width -
                  relativeImageRect.left
              }
            }
            break
        }

        // if (!shouldUpdate) return

        if (dir === 'top') {
          newRect = {
            x: positionRef.current.x,
            y: positionRef.current.y + offset.y,
            width: positionRef.current.width,
            height: positionRef.current.height - offset.y,
            ...__rect
          }
          newInset.top = Math.abs(newRect.y - relativeImageRect.top)
        }
        if (dir === 'right') {
          newRect = {
            x: positionRef.current.x,
            y: positionRef.current.y,
            width: positionRef.current.width + offset.x,
            height: positionRef.current.height,
            ...__rect
          }

          newInset.right = Math.abs(
            // newRect.x +
            newRect.width + newRect.x - relativeImageRect.right
          )
        }
        if (dir === 'bottom') {
          newRect = {
            x: positionRef.current.x,
            y: positionRef.current.y,
            width: positionRef.current.width,
            height: positionRef.current.height + offset.y,
            ...__rect
          }
          newInset.bottom = Math.abs(
            newRect.height + newRect.y - relativeImageRect.bottom
          )
        }
        if (dir === 'left') {
          newRect = {
            x: positionRef.current.x + offset.x,
            y: positionRef.current.y,
            width: positionRef.current.width - offset.x,
            height: positionRef.current.height,
            ...__rect
          }
          newInset.left = Math.abs(newRect.x - relativeImageRect.left)
        }

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (newRect) {
          setInset((pre) => ({
            ...pre,
            ...newInset
          }))
          lastRect = newRect
          setRectBox(lastRect)
        }
      }

      const onMouseUp = (e: MouseEvent) => {
        isResizing = false
        positionRef.current = lastRect

        unbindEvents()
      }

      function bindEvents() {
        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseup', onMouseUp)
      }
      function unbindEvents() {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onMouseUp)
      }
      bindEvents()
    }
  )

  const activeDir = Object.keys(inset).find(
    (dir) => inset[dir as keyof typeof inset] > 0
  )
  const hasActiveDir = !!activeDir

  const resizeCursors = ['top', 'right', 'bottom', 'left'].map((dir) => {
    const isCurrentActive = activeDir === dir
    if (hasActiveDir && !isCurrentActive) return null
    const size = 3
    const getCursorStyle = (dir: 'top' | 'right' | 'bottom' | 'left') => {
      if (dir === 'top' || dir === 'bottom') {
        return {
          top: dir === 'bottom' ? `calc(100% - ${size}px)` : undefined,
          bottom: dir === 'top' ? `calc(100% - ${size}px)` : undefined,
          width: '100%',
          height: `${size}px`
        }
      }
      return {
        left: dir === 'right' ? `calc(100% - ${size}px)` : undefined,
        right: dir === 'left' ? `calc(100% - ${size}px)` : undefined,

        height: '100%',
        width: `${size}px`
      }
    }
    const style = getCursorStyle(dir as any)

    return (
      <div
        className={clx(
          'resize-handler absolute w-full hover:bg-blue-700',
          isCurrentActive && 'bg-blue-500'
        )}
        dir={dir}
        style={{
          ...style
        }}
        key={dir}
        onMouseDown={(e) => {
          handleResize(e, dir as any)
        }}
      ></div>
    )
  })

  return (
    <div className="w-full bg-slate-200">
      <div
        ref={posterBgRef}
        className="poster relative mx-auto w-4/5 overflow-hidden bg-slate-500/50"
        style={{
          aspectRatio: 16 / 9
        }}
      >
        {/* <div className="resize-handler" dir="e"></div>
        <div className="resize-handler" dir="s"></div>
        <div className="resize-handler" dir="w"></div> */}
        <div
          className="striped absolute"
          style={{
            left: rectBox.x,
            top: rectBox.y,
            height: rectBox.height,
            width: rectBox.width
          }}
        ></div>
        <div
          ref={rectWrapperRef}
          onMouseDown={handleWrapperMouseDown}
          className="rect-wrapper gradient absolute bg-red-200"
          style={{
            left: rectBox.x,
            top: rectBox.y,
            height: rectBox.height,
            width: rectBox.width
          }}
        >
          {/* <div className=""> */}
          <div
            ref={imageRef}
            className="absolute bg-green-500"
            style={{
              ...inset
            }}
          ></div>
          {resizeCursors}

          {/* </div> */}
        </div>
      </div>
    </div>
  )
}

export default Background
