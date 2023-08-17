import { FC, SetStateAction } from 'react'
import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { ExclamationCircleOutlined } from '@tezign/icons'
import { createSelectors } from './createSelectors'
import Pubsub from '../utils/pubsub'
import { HistoryRecord, Rect } from '@/interface'
import { toFixed2 } from '@/utils/position'
import { postMessage } from '@/utils'
import { rectBoxRef } from '@/components/background'
import { useExtraStore } from './extra'
import { Button, Checkbox, TzModal } from '@tezign/tezign-ui'
import React from 'react'

export interface Poster {
  width: number
  height: number
}

let modal: ReturnType<typeof TzModal.show>

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
  imageHistory: HistoryRecord[]
  __remount_updater: number
  networkError: any
  loading: boolean
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
  addImageHistory: (urls: HistoryRecord[] | undefined) => void
  setImageSrc: (src: string) => void
  resetBoundary: () => void
}

export const eventPubsub = new Pubsub()

const Footer: FC<{ onOk: any; onCancel: any }> = ({ onOk, onCancel }) => {
  const [checked, setChecked] = React.useState(false)

  return (
    <div className="flex flex-row items-center justify-between">
      <Checkbox
        value={checked}
        onChange={(v) => {
          setChecked(v.target.checked)
        }}
      >
        不再提醒
      </Checkbox>
      <div className="">
        <Button
          type="default"
          onClick={() => {
            onCancel()
            // useExtraStore.setState({
            //   pageChangeAlert: {
            //     show: !checked,
            //     shouldChange: false
            //   }
            // })
          }}
        >
          取消
        </Button>
        <Button
          onClick={() => {
            onOk()
            useExtraStore.setState({
              pageChangeAlert: {
                show: !checked,
                shouldChange: true
              }
            })
          }}
        >
          我知道了
        </Button>
      </div>
    </div>
  )
}

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

    console.log('[reInitialize]: payload ', payload)

    const initData = getInitData(
      maxPosterWidth,
      maxPosterHeight,
      pluginMessage.payload
    )

    console.log('[initData]: ', initData)

    usePluginStore.setState({
      ...initData,
      inset: DEFAULT_INSET
    })
  } else if (pluginMessage.type === 'currentpagechange') {
    if (modal) {
      return
    }
    const onPagechange = () => {
      useExtraStore.setState({
        boxSelectDivStyle: undefined
      })
      usePluginStore.setState({
        imageSrc: undefined,
        inset: DEFAULT_INSET,
        __remount_updater: usePluginStore.getState().__remount_updater + 1,
        networkError: undefined
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
    const {
      pageChangeAlert: { shouldChange, show }
    } = useExtraStore.getState()

    if (show) {
      modal = TzModal.show({
        maskClosable: false,
        width: '360px',
        centered: true,
        footer: (
          <Footer
            onOk={() => {
              modal.destroy()
              modal = undefined
              onPagechange()
            }}
            onCancel={() => {
              modal.destroy()
              modal = undefined
            }}
          />
        ),
        // title: (
        //   <div className="flex items-center gap-2">

        //     <span></span>
        //   </div>
        // ),
        content: (
          <div className="tzui-modal-confirm-body">
            <ExclamationCircleOutlined
              style={{
                color: '#FAAD14'
              }}
            />
            <span className="tzui-modal-confirm-title">
              确认切换页面/画板吗？
            </span>
            <div className="tzui-modal-confirm-content">
              确认切换页面/画板吗？
            </div>
          </div>
        )
      })
    } else {
      if (shouldChange) {
        onPagechange()
      }
    }

    // if (window.confirm('监测到页面切换，确定清空当前插件的历史吗?')) {
    //   // TODO: clear all
    //   useExtraStore.setState({
    //     setBoxSelectDivStyle: undefined
    //   })
    //   usePluginStore.setState({
    //     imageSrc: undefined,
    //     inset: DEFAULT_INSET,
    //     __remount_updater: usePluginStore.getState().__remount_updater + 1
    //     // rectBox: {
    //     //   height: 0,
    //     //   width: 0,
    //     //   x: 0,
    //     //   y: 0
    //     // },
    //   })
    //   parent.postMessage(
    //     {
    //       pluginMessage: {
    //         requestId: pluginMessage.requestId,
    //         payload: {
    //           confirm: true
    //         }
    //       }
    //     },
    //     '*'
    //   )
    // }
  } else if (pluginMessage.type === 'syncStorage') {
    useExtraStore.setState({
      storage: pluginMessage.payload
    })
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
        networkError: undefined,
        inset: DEFAULT_INSET,
        loading: false,
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
