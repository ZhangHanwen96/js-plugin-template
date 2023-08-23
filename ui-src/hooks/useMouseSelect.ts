import { Rect } from '@/interface'
import { useExtraStore } from '@/store/extra'
import React, { useRef } from 'react'

export const useMouseSelect = ({ handleEnd }: { handleEnd: any }) => {
  const rectRef = useRef<Rect>()
  const isMoving = useRef(false)
  const originMouseCords = useRef({ x: 0, y: 0 })

  const handleBoxSelectMouseDown = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    e.preventDefault()
    e.stopPropagation()
    isMoving.current = true

    const container = e.currentTarget
    let box: HTMLDivElement | undefined

    const updateRaf = ({ x, y, width, height }: Rect, box: HTMLDivElement) => {
      //   cancelAnimationFrame(rafId)

      if (isMoving.current) {
        box.style.left = `${x}px`
        box.style.top = `${y}px`
        box.style.width = `${width}px`
        box.style.height = `${height}px`
      }
    }

    const containerRect = container.getBoundingClientRect()
    // 相对于container的绝对位置
    const rx = e.clientX - containerRect.left
    const ry = e.clientY - containerRect.top

    originMouseCords.current = { x: rx, y: ry }

    const startTime = performance.now()

    // or use dragStart see commit: 94ae187f4799b30bfd8e084214787ce91391a649
    const mouseMoveHandler = (e: MouseEvent) => {
      if (!isMoving.current) return
      // 防止 click 不小心触发 move
      if (performance.now() - startTime < 50) {
        return
      }
      e.preventDefault()
      if (!box) {
        box = document.createElement('div')
        box.classList.add('gradient')
        box.style.cssText =
          'position: absolute; \
                  box-sizing: border-box; \
                  background-color: #33a0e44c; z-index: 1000; outline: none;'
        container.appendChild(box)
      }

      const parentRect = container.getBoundingClientRect()
      const rx = e.clientX - parentRect.left
      const ry = e.clientY - parentRect.top
      const width = Math.abs(rx - originMouseCords.current.x)
      const height = Math.abs(ry - originMouseCords.current.y)
      const x = Math.min(rx, originMouseCords.current.x)
      const y = Math.min(ry, originMouseCords.current.y)

      const newRect = { x, y, width, height }
      updateRaf(newRect, box!)
      rectRef.current = newRect
    }

    const mouseUpHandler = () => {
      // meaning no box select
      if (!box) {
        useExtraStore.setState({
          boxSelectDivStyle: undefined
        })
      }
      isMoving.current = false
      handleEnd(rectRef.current as Rect)

      originMouseCords.current = { x: 0, y: 0 }
      box?.remove()
      box = undefined
      rectRef.current = undefined
      document.removeEventListener('mousemove', mouseMoveHandler)
      document.removeEventListener('mouseup', mouseUpHandler)
    }

    document.addEventListener('mousemove', mouseMoveHandler)
    document.addEventListener('mouseup', mouseUpHandler)
  }

  return {
    onMouseDown: handleBoxSelectMouseDown
  }
}
