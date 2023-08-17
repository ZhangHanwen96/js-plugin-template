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
import throttle from 'lodash/throttle'
import loadingGif from '@/assets/image-loading-sekelton.gif'
import { useRequest, useUpdateEffect } from 'ahooks'
import { extendImage } from '@/service/extendImage'
import clx from 'classnames'
import { DEFAULT_INSET, usePluginStore } from '@/store'
import { absolutePositionToPercent } from '@/utils/position'
import { rectBoxRef } from '../background'
import { getCustomImageUrl } from '@/App'
import { delay } from '@/utils'
import { useExtraStore } from '@/store/extra'
import { Mode } from '@/interface'
import { partialRedraw } from '@/service/partialRedraw'

const mockGen = async (nums: number) => {
  const { rectBox, scale } = usePluginStore.getState()

  await delay(2000)

  return new Array(nums)
    .fill(0)
    .map(() =>
      getCustomImageUrl(
        Math.round(rectBox.width / scale),
        Math.round(rectBox.height / scale)
      )
    )
}

interface AIImageProps {
  loading: boolean
  url: string
  selected: boolean
  onImageClick: () => void
}

const AIImage: FC<AIImageProps> = ({
  loading,
  selected,
  url,
  onImageClick
}) => {
  const isLoading = loading || !url

  return (
    <div
      className={clx(
        'cursor-pointer rounded bg-[#f3f5f7] transition-all hover:shadow-md',
        selected && 'ring-2 ring-[#008EFA] ring-offset'
      )}
      onClick={() => {
        if (loading) return
        onImageClick()
      }}
    >
      <img
        src={isLoading ? loadingGif : url}
        crossOrigin="anonymous"
        className={clx(
          'h-16 w-full',
          isLoading ? 'object-scale-down' : 'object-scale-down'
        )}
      />
    </div>
  )
}

let lastMode: Mode

let lastParam: any

// eslint-disable-next-line react/display-name
const ImageList = forwardRef<
  { generateImage: () => void; retry: () => void },
  any
>((props, ref) => {
  const [imageList, setImageList] = useState<{ url: string; mode: Mode }[]>([])

  const { run: runAIExtend, loading } = useRequest(mockGen, {
    manual: true,
    onBefore(params) {
      setImageList(
        Array.from({ length: params[0] }).map(() => ({
          mode: lastMode as Mode,
          url: ''
        }))
      )
    },
    onSuccess: (response) => {
      const data = (response as string[]).map((base64) => {
        return {
          // url: `data:image/png;base64,${base64}`,
          url: base64,
          mode: lastMode as Mode
        }
      })
      setImageList(data)
    }
  })

  const { run: runPartialRedraw } = useRequest(partialRedraw, {
    manual: true,
    onBefore(params) {
      setImageList(
        Array.from({ length: params[0] }).map(() => ({
          mode: lastMode as Mode,
          url: ''
        }))
      )
    }
  })

  const generateImage = () => {
    if (loading) return
    lastMode = useExtraStore.getState().tab
    lastParam = {
      mode: lastMode
      // TODO:
    }
    runAIExtend(3)
  }

  // TODO:
  const retry = () => {
    // lastParam
  }

  useImperativeHandle(ref, () => ({
    generateImage,
    retry
  }))

  const imageSrc = usePluginStore.use.imageSrc?.()

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

  return isEmpty ? (
    <div className="mx-3 my-2 flex h-16 items-center justify-center rounded border border-solid border-[#DCE1E5] text-xs text-[#B1B8C2]">
      <span>延展结果将显示在这里</span>
    </div>
  ) : (
    <div className="mx-3 my-2 box-content grid h-16 grid-cols-4 gap-2">
      {imageList.map(({ mode, url }, index) => {
        return (
          <AIImage
            key={index}
            onImageClick={() => {
              onImageClick(url, mode)
            }}
            loading={loading}
            url={url}
            selected={imageSrc === url}
          />
        )
      })}
    </div>
  )
})

export default ImageList
