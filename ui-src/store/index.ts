import { SetStateAction } from 'react'
import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

import { createSelectors } from './createSelectors'
import Pubsub from '../utils/pubsub'
import { Rect } from '@/interface'
import { toFixed2 } from '@/utils/position'
import { uuid } from '@/utils/uuid'
import { postMessage } from '@/utils'
import { rectBoxRef } from '@/components/background'

export interface Poster {
  width: number
  height: number
}

// image is filled in a <div /> in jsDesign
export interface ImageRectWrapper {
  x: number
  y: number
  width: number
  height: number
}

export const DEFAULT_INSET = {
  left: 0,
  top: 0,
  right: 0,
  bottom: 0
}

type State = {
  scale: number
  poster?: Poster
  rectWrapper?: ImageRectWrapper
  rectBox: Rect
  inset: typeof DEFAULT_INSET
  imageSrc?: string
  imageFile?: File
  imageHistory: string[]
  __remount_updater: number
}

type Actions = {
  calculateScale: ({
    width,
    height
  }: {
    width: number
    height: number
  }) => Promise<void>
  setRectBox: (rect: React.SetStateAction<Rect>) => void
  setInset: (rect: React.SetStateAction<typeof DEFAULT_INSET>) => void
  addImageHistory: (urls: string[] | undefined) => void
  setImageSrc: (src: string) => void
  resetBoundary: () => void
}

export const eventPubsub = new Pubsub()

interface MessageData {
  pluginMessage: {
    type: string
    requestId: string
    payload: any
  }
}
const getInitData = (
  width: number,
  height: number,
  {
    imageWrapperRect,
    poster
  }: {
    imageWrapperRect: ImageRectWrapper
    poster: Poster
  }
) => {
  const posterRatio = poster.width / poster.height
  const containerRatio = width / height
  const isHorizontal = posterRatio > 1

  let scale = isHorizontal ? width / poster.width : height / poster.height

  if (containerRatio > posterRatio) {
    scale = height / poster.height
  }

  const result = {
    rectWrapper: imageWrapperRect,
    poster,
    scale,
    rectBox: {
      height: toFixed2(imageWrapperRect.height * scale),
      width: toFixed2(imageWrapperRect.width * scale),
      x: toFixed2(imageWrapperRect.x * scale),
      y: toFixed2(imageWrapperRect.y * scale)
    }
  }
  // console.log(result, 'result')
  return result
}

// will be updated
// HACK: ???
let maxPosterWidth = 520
let maxPosterHeight = 460 - 80 - 120

window.addEventListener('message', (e: MessageEvent<MessageData>) => {
  const pluginMessage = e.data.pluginMessage
  if (!pluginMessage) return
  console.log(
    '%c[IFRAME] type: ' + pluginMessage?.type,
    'color: green; font-weight: bold; font-size: 16px'
  )
  if (pluginMessage?.type === 'reInitialize') {
    const payload = pluginMessage.payload
    if (!payload) {
      usePluginStore.setState({
        rectWrapper: undefined,
        poster: undefined,
        scale: 1
      })
      return
    }
    const initData = getInitData(
      maxPosterWidth,
      maxPosterHeight,
      pluginMessage.payload
    )
    usePluginStore.setState({
      ...initData,
      inset: DEFAULT_INSET
    })
  } else if (pluginMessage.type === 'currentpagechange') {
    if (window.confirm('监测到页面切换，确定清空当前插件的历史吗?')) {
      // TODO: clear all
      usePluginStore.setState({
        imageSrc: undefined,
        inset: DEFAULT_INSET,
        __remount_updater: usePluginStore.getState().__remount_updater + 1
        // rectBox: {
        //   height: 0,
        //   width: 0,
        //   x: 0,
        //   y: 0
        // },
      })
      parent.postMessage(
        {
          pluginMessage: {
            requestId: pluginMessage.requestId,
            payload: {
              confirm: true
            }
          }
        },
        '*'
      )
    }
  }

  const { requestId, payload } = pluginMessage
  if (requestId) {
    eventPubsub.notify(requestId, payload)
  }
})

const _pluginStore = create(
  devtools(
    subscribeWithSelector(
      immer<State & Actions>((set, get) => ({
        scale: 1,
        inset: DEFAULT_INSET,
        rectBox: {
          height: 0,
          width: 0,
          x: 0,
          y: 0
        },
        __remount_updater: 0,
        imageHistory: [],
        imageSrc: undefined,
        poster: undefined,
        rectWrapper: undefined,
        async calculateScale({ width, height }) {
          maxPosterWidth = width
          maxPosterHeight = height
          const responsePromise = postMessage<{
            imageWrapperRect: ImageRectWrapper
            poster: Poster
          } | null>({
            type: 'getPosterAndWrapperRect'
          })

          try {
            const r = await responsePromise
            // meaning need to upload image
            if (!r) {
              set((state) => {
                state.scale = 1
                state.poster = undefined
                state.rectWrapper = undefined
                state.inset = DEFAULT_INSET
              })
              return
            }

            const { poster, rectBox, rectWrapper, scale } = getInitData(
              width,
              height,
              r
            )

            set((state) => {
              state.rectWrapper = rectWrapper
              state.poster = poster
              state.scale = scale
              state.rectBox = rectBox
              state.inset = DEFAULT_INSET
            })
          } catch (error) {
            console.error(error)
          }
        },
        setInset: (inset) => {
          const result =
            typeof inset === 'function' ? inset(get().inset) : inset
          set((state) => {
            state.inset = result
          })
        },
        setRectBox(rect) {
          const result = typeof rect === 'function' ? rect(get().rectBox) : rect
          set((state) => {
            state.rectBox = result
          })
        },
        setImageSrc(src) {
          set((state) => {
            state.imageSrc = src
          })
        },
        addImageHistory(urls) {
          set((state) => {
            if (urls) {
              state.imageHistory.push(...urls)
            } else {
              state.imageHistory.splice(0)
            }
          })
        },
        resetBoundary() {
          const { rectBox, inset } = get()

          const actualImageRect: Rect = {
            x: rectBox.x + inset.left,
            y: rectBox.y + inset.top,
            width: rectBox.width - inset.left - inset.right,
            height: rectBox.height - inset.top - inset.bottom
          }

          rectBoxRef.current = actualImageRect
          set((state) => {
            state.inset = DEFAULT_INSET
            state.rectBox = actualImageRect
          })
        }
      }))
    ),
    {
      name: 'tezign-jishi-store',
      store: 'tezign-jishi-store'
    }
  )
)
const usePluginStore = createSelectors(_pluginStore)

export { usePluginStore }
