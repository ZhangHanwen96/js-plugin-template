import React, { FC, useContext, useEffect, useState } from 'react'
import loadingGif from '@/assets/image-loading-sekelton.gif'
import clx from 'classnames'
import { ctx } from './ImageProvider'
import { useMemoizedFn, useRequest } from 'ahooks'
import { v4 as uuid } from 'uuid'
import { ExtendPosition, extendImageSingle } from '@/service/extendImage'
import { Popover, message } from '@tezign/tezign-ui'
import {
  base64ToDataUrl,
  dataUrlToFile,
  downloadFile,
  fileToUrl
} from '@/utils'
import { partialRedraw } from '@/service/partialRedraw'
import { Mode } from '@/interface'
import { usePluginStore } from '@/store'
import { WarningOutlined } from '@tezign/icons'

interface AIImageProps {
  onImageClick: (
    params: { dataUrl: string; mode: Mode; id: string },
    dir?: ExtendPosition
  ) => void
  index: number
  setLoading: (index: number, loading: boolean) => void
}

const AIImage: FC<AIImageProps> = ({
  index,
  onImageClick,
  setLoading: syncLoading
}) => {
  const { requestParams } = useContext(ctx)
  const [loading, setLoading] = useState(true)
  const [imageData, setImageData] = useState<
    { dataUrl: string; mode: Mode; id: string } | undefined
  >()

  const memoizedImageClick = useMemoizedFn(onImageClick)

  const { runAsync: runPartialRedraw, error: e1 } = useRequest(partialRedraw, {
    manual: true,
    onBefore() {
      setLoading(true)
      syncLoading(index, true)
    },
    onFinally() {
      setLoading(false)
      syncLoading(index, false)
    },
    onSuccess(data) {
      const image = data[0]
      const dataUrl = base64ToDataUrl(image)

      dataUrlToFile(dataUrl, `partial-${Date.now()}`).then(downloadFile)

      setImageData({
        dataUrl: dataUrl,
        mode: 'partialRedraw',
        id: uuid()
      })
    },
    onError() {
      message.error(`AI图片重绘第 ${index + 1} 张失败，请重试`)
    }
  })

  const { run: runAIExtend, error: e2 } = useRequest(extendImageSingle, {
    manual: true,
    onBefore() {
      setLoading(true)
      syncLoading(index, true)
    },
    onSuccess: async (response) => {
      const dataUrl = await fileToUrl(response)
      const data = {
        dataUrl: dataUrl,
        mode: 'extend' as Mode,
        id: uuid()
      }
      setImageData(data)
    },
    onFinally() {
      setLoading(false)
      syncLoading(index, false)
    },
    onError() {
      message.error(`AI图片延展第 ${index + 1} 张失败，请重试`)
    }
  })

  useEffect(() => {
    if (!requestParams) {
      setLoading(true)
      return
    }
    setImageData(undefined)

    console.log('requestParams', requestParams)

    if (requestParams.mode === 'extend') {
      runAIExtend(requestParams.params)
    } else {
      runPartialRedraw(requestParams.params)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestParams])

  const imageSrc = usePluginStore.use.imageSrc()
  const selected = imageSrc === imageData?.dataUrl

  const error = e1 || e2

  return (
    <div
      className={clx(
        'cursor-pointer rounded bg-[#f3f5f7] transition-all hover:shadow-md',
        selected && 'ring-2 ring-[#008EFA] ring-offset'
      )}
      onClick={() => {
        if (loading || error || !imageData?.dataUrl || selected) return
        memoizedImageClick(
          imageData,
          (requestParams.params?.position ?? undefined) as ExtendPosition
        )
      }}
    >
      {error ? (
        <div
          className={clx(
            'h-16 w-full flex items-center justify-center text-[var(--color-danger)] bg-[#FFF2F2]'
          )}
        >
          <WarningOutlined />
          <span className="ml-1">生成失败</span>
        </div>
      ) : loading ? (
        <img
          src={loadingGif}
          crossOrigin="anonymous"
          className={clx(
            'h-16 w-full',
            loading ? 'object-scale-down' : 'object-scale-down'
          )}
        />
      ) : (
        <Popover
          mouseEnterDelay={0.5}
          content={
            <img
              src={imageData?.dataUrl}
              crossOrigin="anonymous"
              className={clx(
                'h-60 w-full',
                loading ? 'object-scale-down' : 'object-scale-down'
              )}
            />
          }
        >
          <img
            src={imageData?.dataUrl}
            crossOrigin="anonymous"
            className={clx(
              'h-16 w-full',
              loading ? 'object-scale-down' : 'object-scale-down'
            )}
          />
        </Popover>
      )}
    </div>
  )
}

export default AIImage
