import React, {
  FC,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useReducer,
  useState
} from 'react'
import SingleAiImage from './AIImage'
import throttle from 'lodash/throttle'
import loadingGif from '@/assets/image-loading-sekelton.gif'
import { useMemoizedFn, useRequest, useUpdate, useUpdateEffect } from 'ahooks'
import {
  getExtendAIParam,
  extendImage,
  getExtendImageSingleBase,
  ExtendPosition
} from '@/service/extendImage'
import clx from 'classnames'
import { DEFAULT_INSET, usePluginStore } from '@/store'
import { absolutePositionToPercent } from '@/utils/position'
import { rectBoxRef } from '@/store'
import { getCustomImageUrl } from '@/App'
import { base64ToDataUrl, delay, fileToUrl } from '@/utils'
import { useExtraStore } from '@/store/extra'
import { Mode } from '@/interface'
// import { partialRedraw } from '@/service/partialRedraw'
import { message } from '@tezign/tezign-ui'
import { getPartialRedrawParams, partialRedraw } from '@/service/partialRedraw'
import { Context, ctx } from './ImageProvider'
import { AIProxyParams } from '@/service/aiProxy'

// const mockGen = async (nums: number) => {
//   const { rectBox, scale } = usePluginStore.getState()

//   await delay(2000)

//   return new Array(nums)
//     .fill(0)
//     .map(() =>
//       getCustomImageUrl(
//         Math.round(rectBox.width / scale),
//         Math.round(rectBox.height / scale)
//       )
//     )
// }

// interface AIImageProps {
//   loading: boolean
//   url: string
//   selected: boolean
//   onImageClick: () => void
// }

// const AIImage: FC<AIImageProps> = ({
//   loading,
//   selected,
//   url,
//   onImageClick
// }) => {
//   const isLoading = loading || !url

//   return (
//     <div
//       className={clx(
//         'cursor-pointer rounded bg-[#f3f5f7] transition-all hover:shadow-md',
//         selected && 'ring-2 ring-[#008EFA] ring-offset'
//       )}
//       onClick={() => {
//         if (loading) return
//         onImageClick()
//       }}
//     >
//       <img
//         src={isLoading ? loadingGif : url}
//         crossOrigin="anonymous"
//         className={clx(
//           'h-16 w-full',
//           isLoading ? 'object-scale-down' : 'object-scale-down'
//         )}
//       />
//     </div>
//   )
// }

const IMAGE_NUMBERS = 2

// eslint-disable-next-line react/display-name
const ImageList = forwardRef<
  { generateImage: () => void; retry: () => void },
  any
>((props, ref) => {
  const [imageList, setImageList] = useState<{ url: string; mode: Mode }[]>([])

  const [requestParams, setRequestParams] = useState<
    Context['requestParams'] | undefined
  >()

  const [imageLoadings, setImageLoadings] = useState<boolean[]>([])

  const isLoading = imageLoadings.some((b) => b === true)

  useUpdateEffect(() => {
    usePluginStore.setState({
      loading: isLoading
    })
  }, [isLoading])

  const generateImage = async () => {
    if (isLoading) return
    const mode = useExtraStore.getState().tab
    setImageList(Array.from({ length: IMAGE_NUMBERS }))
    setRequestParams(undefined)
    if (mode === 'extend') {
      const { extendDirection, height, file, width } = await getExtendAIParam()
      const extendParams = await getExtendImageSingleBase(file, {
        height,
        position: `to${extendDirection.toUpperCase()}` as Exclude<
          ExtendPosition,
          'center'
        >,
        width,
        quantity: 1
      })
      setRequestParams({
        mode: 'extend',
        params: extendParams
      })
    } else {
      const redrawParams = await getPartialRedrawParams()
      setRequestParams({
        mode: 'partialRedraw',
        params: redrawParams as AIProxyParams
      })
    }
  }

  // TODO:
  const retry = () => {
    // lastParam
  }

  useImperativeHandle(ref, () => ({
    generateImage,
    retry
  }))

  const onImageClick = (url: string, mode: Mode) => {
    const { setInset, setImageSrc, addImageHistory } = usePluginStore.getState()
    const { setBoxSelectDivStyle } = useExtraStore.getState()

    setImageSrc(url)
    // reset box select
    setBoxSelectDivStyle(undefined)
    addImageHistory([
      {
        mode,
        src: url,
        timestamp: Date.now()
      }
    ])
    // file
    // usePluginStore.setState({
    //   imageFile: undefined
    // })
    setInset(DEFAULT_INSET)

    const poster = document.getElementById('poster')

    const pRect = absolutePositionToPercent(
      rectBoxRef.current,
      poster!.getBoundingClientRect()
    )

    parent.postMessage(
      {
        pluginMessage: {
          type: 'updateImage',
          payload: {
            src: url,
            rect: pRect
          }
        }
      },
      '*'
    )
  }

  const isEmpty = imageList.length === 0

  const setSingleLoading = useMemoizedFn((index: number, loading: boolean) => {
    setImageLoadings((prev) => {
      const copy = [...prev]
      copy[index] = loading
      return copy
    })
  })

  const contextValue = useMemo(() => {
    return {
      requestParams
    }
  }, [requestParams])

  return (
    <ctx.Provider value={contextValue}>
      {isEmpty ? (
        <div className="mx-3 my-2 flex h-16 items-center justify-center rounded border border-solid border-[#DCE1E5] text-xs text-[#B1B8C2]">
          <span>延展结果将显示在这里</span>
        </div>
      ) : (
        <div className="mx-3 my-2 box-content grid h-16 grid-cols-4 gap-2">
          {imageList.map((_, index) => {
            return (
              <SingleAiImage
                key={index}
                index={index}
                onImageClick={onImageClick}
                setLoading={setSingleLoading}
              />
            )
          })}
        </div>
      )}
    </ctx.Provider>
  )
})

export default ImageList
