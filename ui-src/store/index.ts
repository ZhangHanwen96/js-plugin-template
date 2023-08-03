import { SetStateAction } from 'react'
import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

import { createSelectors } from './createSelectors'
import Pubsub from '../utils/pubsub'
import { Rect } from '@/interface'

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
}

const eventPubsub = new Pubsub()

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
  const isHorizontal = posterRatio > 1

  const scale = isHorizontal ? width / poster.width : height / poster.height

  return {
    rectWrapper: imageWrapperRect,
    poster,
    scale,
    rectBox: {
      height: imageWrapperRect.height * scale,
      width: imageWrapperRect.width * scale,
      x: imageWrapperRect.x * scale,
      y: imageWrapperRect.y * scale
    }
  }
}

const genUUid = () => {
  return Math.ceil(Math.random() * 10000) + ''
}

// will be updated
// HACK: ???
let lastWidth = 520
let lastHeight = 460

window.addEventListener('message', (e: MessageEvent<MessageData>) => {
  const pluginMessage = e.data.pluginMessage
  if (!pluginMessage) return
  if (!pluginMessage?.requestId) {
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
      const initData = getInitData(lastWidth, lastHeight, pluginMessage.payload)
      usePluginStore.setState({
        ...initData,
        inset: DEFAULT_INSET
      })
    }
  } else {
    const { requestId, payload } = pluginMessage
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
        poster: undefined,
        rectWrapper: undefined,
        async calculateScale({ width, height }) {
          lastWidth = width
          lastHeight = height

          const requestId = genUUid()
          parent.postMessage({
            pluginMessage: {
              type: 'getPosterAndWrapperRect',
              requestId
            }
          })

          const responsePromise = new Promise<{
            imageWrapperRect: ImageRectWrapper
            poster: Poster
          } | null>((resolve, reject) => {
            eventPubsub.once(requestId, (data) => {
              resolve(data)
            })
            setTimeout(() => {
              reject(new Error('timeout'))
            }, 4000)
          })

          try {
            const r = await responsePromise
            console.log('r: ', r)
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
