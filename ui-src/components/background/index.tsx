/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useRef, useState } from 'react'
import { useMemoizedFn, useMount, useUnmountedRef } from 'ahooks'
import { usePluginStore } from '../../store'
import clx from 'classnames'
import { Rect } from '@/interface'
import {
  absolutePositionToPercent,
  percentPositionToAbsolute
} from '@/utils/position'

let isDraging = false
let isResizing = false

let startOrigin = {
  x: 0,
  y: 0
}

let lastRect: Rect

export const rectBoxRef = {
  current: undefined
} as {
  current: Rect | undefined
}

// plugin -> absolutePositionToPercent(targetRect, pluginContainerRect)
// -> percentPositionToAbsolute(targetRect, editorContainerRect) -> editor

const Background = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const posterBgRef = useRef<HTMLDivElement>(null)
  const rectWrapperRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)

  const rectBox = usePluginStore.use.rectBox()
  const inset = usePluginStore.use.inset()
  const setRectBox = usePluginStore.use.setRectBox()
  const setInset = usePluginStore.use.setInset()

  const [imageNode, setImageNode] = useState<{ thumbSrc: string }>()

  // const insetRef = useRef<typeof DEFAULT_INSET>()
  const mounted = useRef(false)
  if (!mounted.current) {
    rectBoxRef.current = rectBox
  }
  useMount(() => {
    mounted.current = true
  })

  useMount(() => {
    let handler: any
    window.addEventListener(
      'message',
      (handler = (e: MessageEvent<any>) => {
        const pluginMessage = e.data.pluginMessage
        if (!pluginMessage) return
        if (pluginMessage?.requestId) {
          return
        }

        const { type, payload } = pluginMessage || {}
        if (type == 'syncEditorToPlugin') {
          if (!posterBgRef.current) return
          const pRect = payload
          const _containerRect = posterBgRef.current?.getBoundingClientRect()
          const containerRect: Rect = {
            x: 0,
            y: 0,
            width: _containerRect.width,
            height: _containerRect.height
          }
          const rect = percentPositionToAbsolute(pRect, containerRect)
          // consider inset
          const inset = usePluginStore.getState().inset
          const _rect = {
            x: rect.x - inset.left,
            y: rect.y - inset.top,
            width: rect.width + inset.left + inset.right,
            height: rect.height + inset.top + inset.bottom
          }
          setRectBox(_rect)
          rectBoxRef.current = _rect
        }
        if (type === 'resetImage') {
          const url = (payload.thumbSrc = URL.createObjectURL(
            new Blob([payload.thumb], { type: 'image/png' })
          ))
          setTimeout(() => {
            URL.revokeObjectURL(url)
          }, 20_000)
          setImageNode(payload)
        }
      })
    )
    return () => {
      window.removeEventListener('message', handler)
    }
  })

  const handleWrapperMouseDown = useMemoizedFn(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      isDraging = true
      startOrigin = {
        x: e.clientX,
        y: e.clientY
      }
      bindEvents()

      const oldRect: Rect = rectBox
      let latestRect: Rect

      function wrapperMove(e: MouseEvent) {
        if (!isDraging || !rectWrapperRef.current) return

        const { clientX, clientY } = e

        const offset = {
          x: clientX - startOrigin.x,
          y: clientY - startOrigin.y
        }

        setRectBox((pre) => {
          latestRect = {
            ...pre,
            x: oldRect.x + offset.x,
            y: oldRect.y + offset.y
          }
          return latestRect
        })
      }

      function wrapperMouseUp(e: MouseEvent) {
        unbindEvents()
        isDraging = false

        if (latestRect) {
          rectBoxRef.current = latestRect
        }

        // sync rect to editor
        const pRect = absolutePositionToPercent(
          rectBoxRef.current,
          posterBgRef.current?.getBoundingClientRect() as DOMRect
        )
        parent.postMessage(
          {
            pluginMessage: {
              type: 'syncPlugintoEditor',
              payload: pRect
            }
          },
          '*'
        )
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

    const height = posterBgRef.current.style.height
    posterBgRef.current.style.height = '100%'
    // force reflow
    posterBgRef.current.offsetHeight
    const { height: maxHeight } = posterBgRef.current.getBoundingClientRect()
    posterBgRef.current.style.height = height

    usePluginStore
      .getState()
      .calculateScale({ height: maxHeight, width: rect.width })
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
        // const wrapperRectInfo = rectWrapperRef.current.getBoundingClientRect()

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

        let newRect = {} as Rect
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
                const height = rectBoxRef.current.height + rectBoxRef.current.y
                __rect.y = 0
                __rect.height = height
              } else {
                __rect.height =
                  rectBoxRef.current.y +
                  rectBoxRef.current.height -
                  relativeImageRect.top
                __rect.y = relativeImageRect.top
              }
            }
            break
          case 'right':
            if (clientX > posterRect.right) {
              __rect.width = posterRect.width - rectBoxRef.current.x
            } else if (clientX < imageRect.right) {
              __rect.width = relativeImageRect.right - rectBoxRef.current.x
            }

            break
          case 'bottom':
            if (clientY > posterRect.bottom || clientY < imageRect.bottom) {
              if (clientY > posterRect.bottom) {
                __rect.height = posterRect.height - rectBoxRef.current.y
              } else {
                __rect.height = relativeImageRect.bottom - rectBoxRef.current.y
              }
            }
            break
          case 'left':
            if (clientX < posterRect.x || clientX > imageRect.left) {
              if (clientX < posterRect.x) {
                __rect.x = 0
                __rect.width = rectBoxRef.current.x + rectBoxRef.current.width
              } else {
                __rect.x = relativeImageRect.left
                __rect.width =
                  rectBoxRef.current.x +
                  rectBoxRef.current.width -
                  relativeImageRect.left
              }
            }
            break
        }

        if (dir === 'top') {
          newRect = {
            x: rectBoxRef.current.x,
            y: rectBoxRef.current.y + offset.y,
            width: rectBoxRef.current.width,
            height: rectBoxRef.current.height - offset.y,
            ...__rect
          }
          newInset.top = Math.abs(newRect.y - relativeImageRect.top)
        }
        if (dir === 'right') {
          newRect = {
            x: rectBoxRef.current.x,
            y: rectBoxRef.current.y,
            width: rectBoxRef.current.width + offset.x,
            height: rectBoxRef.current.height,
            ...__rect
          }

          newInset.right = Math.abs(
            // newRect.x +
            newRect.width + newRect.x - relativeImageRect.right
          )
        }
        if (dir === 'bottom') {
          newRect = {
            x: rectBoxRef.current.x,
            y: rectBoxRef.current.y,
            width: rectBoxRef.current.width,
            height: rectBoxRef.current.height + offset.y,
            ...__rect
          }
          newInset.bottom = Math.abs(
            newRect.height + newRect.y - relativeImageRect.bottom
          )
        }
        if (dir === 'left') {
          newRect = {
            x: rectBoxRef.current.x + offset.x,
            y: rectBoxRef.current.y,
            width: rectBoxRef.current.width - offset.x,
            height: rectBoxRef.current.height,
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
        rectBoxRef.current = lastRect

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
          isCurrentActive && 'bg-blue-400',
          'group-hover:bg-blue-700'
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

  const editorPoster = usePluginStore.use.poster?.()
  const posterRatio = editorPoster
    ? editorPoster.width / editorPoster.height
    : undefined
  const isHorizontal = posterRatio ? posterRatio > 1 : false

  return (
    <div className="h-full w-full bg-slate-200 px-8 py-4" ref={containerRef}>
      <div
        ref={posterBgRef}
        className="poster relative m-auto overflow-hidden bg-slate-500/50"
        style={{
          width: posterRatio ? (isHorizontal ? '100%' : undefined) : undefined,
          height: posterRatio ? (isHorizontal ? undefined : '100%') : undefined,
          aspectRatio: posterRatio
        }}
      >
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
          className="rect-wrapper gradient group absolute bg-red-200"
          style={{
            left: rectBox.x,
            top: rectBox.y,
            height: rectBox.height,
            width: rectBox.width
          }}
        >
          <div
            ref={imageRef}
            className="absolute bg-green-500"
            style={{
              ...inset,
              backgroundImage: imageNode?.thumbSrc
                ? `url(${imageNode?.thumbSrc})`
                : undefined,
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          ></div>
          {resizeCursors}
        </div>
      </div>
    </div>
  )
}

export default Background
