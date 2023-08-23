/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useRef, useState } from 'react'
import { useMemoizedFn, useMount, useToggle, useUpdateEffect } from 'ahooks'
import { rectBoxRef, usePluginStore } from '@/store'
import clx from 'classnames'
import { Rect } from '@/interface'
import { useMouseSelect } from '@/hooks/useMouseSelect'
import {
  absolutePositionToPercent,
  percentPositionToAbsolute
} from '@/utils/position'
import Marklines, { marklinePubsub } from '../Marklines'
import { useExtraStore } from '@/store/extra'
import { Button, Tooltip } from '@tezign/tezign-ui'
import { RedoOutlined, RestOutlined } from '@tezign/icons'

let isDraging = false
let isResizing = false
let __markline_id = 0

let startOrigin = {
  x: 0,
  y: 0
}

const cursors: Record<
  'left' | 'top' | 'right' | 'bottom',
  React.CSSProperties['cursor']
> = {
  left: 'w-resize',
  right: 'e-resize',
  top: 'n-resize',
  bottom: 's-resize'
}

let lastRect: Rect

const isIntersecting = (a: Rect, b: Rect) => {
  return !(
    a.x < b.x &&
    a.x + b.width > b.x + b.width &&
    a.y < b.y &&
    a.y + b.height > b.y + b.height
  )
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
  const imageSrc = usePluginStore.use.imageSrc?.()
  const setImageSrc = usePluginStore.use.setImageSrc()
  const resetBoundary = usePluginStore.use.resetBoundary()
  const tab = useExtraStore.use.tab()

  const boxSelectDivStyle = useExtraStore.use.boxSelectDivStyle?.()
  const setBoxSelectDivStyle = useExtraStore.use.setBoxSelectDivStyle()

  // console.log('[Rect Box]:', rectBox)
  // console.log('[boxSelectDivStyle]', boxSelectDivStyle)

  /**
   * @param rect {Rect} relative to 'poster'
   */
  const handleMouseSelectEnd = useMemoizedFn((rect: Rect) => {
    if (!rect || !rectBoxRef.current || !imageSrc) return
    if (!isIntersecting(rect, rectBoxRef.current)) return

    setBoxSelectDivStyle(rect)

    const right = Math.min(
      rect.x + rect.width,
      rectBoxRef.current.x + rectBoxRef.current.width
    )
    const bottom = Math.min(
      rect.y + rect.height,
      rectBoxRef.current.height + rectBoxRef.current.y
    )
    const left = Math.max(rect.x, rectBoxRef.current.x)
    const top = Math.max(rect.y, rectBoxRef.current.y)
    const intersectionRect = {
      x: left,
      y: top,
      width: right - left,
      height: bottom - top
    }

    const relativeIntersectionRectToImage = {
      ...intersectionRect,
      x: intersectionRect.x - rectBoxRef.current.x,
      y: intersectionRect.y - rectBoxRef.current.y
    }

    const percentageRect = absolutePositionToPercent(
      relativeIntersectionRectToImage,
      {
        x: 0,
        y: 0,
        width: rectBoxRef.current.width,
        height: rectBoxRef.current.height
      }
    )

    console.log('percentageRect: ', percentageRect)
  })

  const { onMouseDown: handleMouseSelectDown } = useMouseSelect({
    handleEnd: handleMouseSelectEnd
  })

  const syncPluginToEditor = useMemoizedFn(() => {
    if (!posterBgRef.current) return
    const pRect = absolutePositionToPercent(
      rectBoxRef.current,
      posterBgRef.current?.getBoundingClientRect()
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
  })

  const mounted = useRef(false)
  if (!mounted.current) {
    rectBoxRef.current = rectBox
  }
  useMount(() => {
    mounted.current = true
  })

  const calculateScale = () => {
    const rect = posterBgRef.current.getBoundingClientRect()

    const height = posterBgRef.current.style.height
    posterBgRef.current.style.height = '100%'
    // force reflow
    posterBgRef.current.offsetHeight
    const { height: maxHeight } = posterBgRef.current.getBoundingClientRect()
    posterBgRef.current.style.height = height

    const width = posterBgRef.current.style.width
    posterBgRef.current.style.width = '100%'
    // force reflow
    posterBgRef.current.offsetHeight
    const { width: maxWidth } = posterBgRef.current.getBoundingClientRect()
    posterBgRef.current.style.width = width

    console.log('[Max Rect]: ,', maxHeight, maxWidth)
    usePluginStore
      .getState()
      .calculateScale({ height: maxHeight, width: maxWidth })
      .then(() => {
        rectBoxRef.current = usePluginStore.getState().rectBox
      })
  }

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
        console.log(
          '%c[IFRAME] type: ' + type,
          'color: green; font-weight: bold; font-size: 16px'
        )
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
          const reader = new FileReader()
          const blob = new Blob([payload.thumb], { type: 'image/png' })
          const file = new File([blob], 'background.png', { type: 'image/png' })
          reader.readAsDataURL(file)
          usePluginStore.setState({
            imageFile: file
          })
          // _image_bytes = payload.thumb as Uint8Array
          reader.onload = () => {
            setImageSrc(reader.result as string)
          }
        }
      })
    )
    return () => {
      window.removeEventListener('message', handler)
    }
  })

  const handleWrapperMouseDown = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
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

      // draw lines
      const currentMarklineId = ++__markline_id
      Promise.resolve().then(() => {
        if (currentMarklineId === __markline_id) {
          marklinePubsub.notify('draw-line', {
            offsetX: offset.x,
            offsetY: offset.y
          })
        }
      })
    }

    function wrapperMouseUp() {
      unbindEvents()
      isDraging = false

      marklinePubsub.notify('hide-line')

      if (latestRect) {
        rectBoxRef.current = latestRect
      }

      // sync rect to editor
      syncPluginToEditor()
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

  useMount(() => {
    if (!posterBgRef.current) return
    calculateScale()
  })

  const handleResize = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    dir: any
  ) => {
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
          // @ts-ignore
          x: rectBoxRef.current.x,
          // @ts-ignore
          y: rectBoxRef.current.y + offset.y,
          // @ts-ignore
          width: rectBoxRef.current.width,
          // @ts-ignore
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

    const onMouseUp = () => {
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

  const activeDir = Object.keys(inset).find(
    (dir) => inset[dir as keyof typeof inset] > 0
  )
  const hasActiveDir = !!activeDir

  const resizeCursors = ['top', 'right', 'bottom', 'left'].map((dir) => {
    if (tab !== 'extend') return
    const isCurrentActive = activeDir === dir
    if (hasActiveDir && !isCurrentActive) return null

    const size = 4

    const getCursorStyle = (dir: 'top' | 'right' | 'bottom' | 'left') => {
      if (dir === 'top' || dir === 'bottom') {
        return {
          top: dir === 'bottom' ? `calc(100% - ${size}px)` : undefined,
          bottom: dir === 'top' ? `calc(100% - ${size}px)` : undefined,
          left: '10px',
          right: '10px',
          height: `${size}px`,
          cursor: 'ns-resize'
        } as React.CSSProperties
      }
      return {
        left: dir === 'right' ? `calc(100% - ${size}px)` : undefined,
        right: dir === 'left' ? `calc(100% - ${size}px)` : undefined,
        top: '10px',
        bottom: '10px',
        width: `${size}px`,
        cursor: 'ew-resize'
      } as React.CSSProperties
    }
    const style = getCursorStyle(dir as any)

    return (
      <div
        className={clx(
          'resize-handler absolute hover:bg-opacity-100 rounded-sm',
          isCurrentActive
            ? 'bg-sky-600 bg-opacity-100'
            : 'bg-[#0cc5ae] bg-opacity-40'
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

  let fullHeight = false
  // TODO: ajust base on container full height
  if (520 / 260 > posterRatio) {
    fullHeight = true
  }

  const posterStyle = {
    width: posterRatio
      ? isHorizontal
        ? fullHeight
          ? undefined
          : '100%'
        : undefined
      : '100%',
    height: posterRatio
      ? isHorizontal
        ? fullHeight
          ? '100%'
          : undefined
        : '100%'
      : undefined
  }

  useUpdateEffect(() => {
    if (tab === 'partialRedraw') {
      resetBoundary()
    } else {
      setBoxSelectDivStyle(undefined)
    }
  }, [tab])

  const boxSelectDiv = () => {
    return (
      boxSelectDivStyle && (
        <div
          className="gradient absolute"
          style={{
            width: boxSelectDivStyle.width,
            height: boxSelectDivStyle.height,
            left: boxSelectDivStyle.x,
            top: boxSelectDivStyle.y,
            backgroundColor: '#33a0e44c'
          }}
        />
      )
    )
  }

  return (
    <div
      className="relative flex h-full w-full items-center justify-center rounded bg-[#F3F5F7] p-2"
      ref={containerRef}
    >
      {tab === 'extend' && (
        <Tooltip title="重置延展区域">
          <Button
            className="!absolute right-1 top-1"
            icon={<RedoOutlined rotate={-90} />}
            size="small"
            type="default"
            onClick={resetBoundary}
          />
        </Tooltip>
      )}
      <div
        ref={posterBgRef}
        id="poster"
        className="poster relative m-auto overflow-hidden bg-white"
        style={{
          ...posterStyle,
          aspectRatio: posterRatio
        }}
        onMouseDownCapture={tab === 'partialRedraw' && handleMouseSelectDown}
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
          // group
          className="rect-wrapper gradient absolute bg-red-200"
          style={{
            left: rectBox.x,
            top: rectBox.y,
            height: rectBox.height,
            width: rectBox.width
          }}
        >
          <div
            ref={imageRef}
            className="absolute bg-green-300/30"
            style={{
              ...inset,
              backgroundImage: imageSrc ? `url(${imageSrc})` : undefined,
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          ></div>
          {resizeCursors}
        </div>
        {boxSelectDiv()}
        <Marklines />
      </div>
    </div>
  )
}

export default Background
