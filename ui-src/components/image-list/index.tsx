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

const mockGen = async () => {
  const { rectBox, scale } = usePluginStore.getState()

  await delay(1000)

  const url = getCustomImageUrl(
    Math.round(rectBox.width / scale),
    Math.round(rectBox.height / scale)
  )
  console.log(url)

  return url
}

const AIImage: FC<any> = ({ updater }) => {
  const [url, setUrl] = useState('')
  const { run, loading } = useRequest(mockGen, {
    manual: true,
    onSuccess: (response) => {
      setUrl(response)
    }
  })

  useEffect(() => {
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updater])

  const onImageClick = () => {
    const { setInset, setImageSrc, addImageHistory } = usePluginStore.getState()

    setImageSrc(url)
    addImageHistory([url])
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

  const isLoading = loading || !url

  return (
    <div
      className={'cursor-pointer bg-[#f3f5f7] transition-all hover:shadow-md'}
      onClick={() => {
        if (loading) return
        onImageClick()
      }}
    >
      <img
        src={isLoading ? loadingGif : url}
        crossOrigin="anonymous"
        className={clx(
          'h-20 w-full',
          isLoading ? 'object-scale-down' : 'object-scale-down'
        )}
      />
    </div>
  )
}

// eslint-disable-next-line react/display-name
const ImageList = forwardRef<{ generateImage: () => void }, any>(
  (props, ref) => {
    const [updater, forceUpdate] = useReducer((x) => x + 1, 0)

    const generateImage = useMemo(() => {
      return throttle(forceUpdate, 2000, {
        leading: true,
        trailing: false
      })
    }, [])

    useImperativeHandle(ref, () => ({
      generateImage
    }))

    return updater === 0 ? (
      <div className="flex h-20 w-full items-center justify-center gap-1 px-2 text-xs text-[#B1B8C2]">
        <span>延展结果将显示在这里</span>
      </div>
    ) : (
      <div className="box-content grid h-20 grid-cols-4 gap-2 px-2 py-1">
        {Array.from({ length: 2 }).map((_, index) => {
          return <AIImage key={index} updater={updater} />
        })}
      </div>
    )
  }
)

export default ImageList
