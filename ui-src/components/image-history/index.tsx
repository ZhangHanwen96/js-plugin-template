import { DEFAULT_INSET, rectBoxRef, usePluginStore } from '@/store'
import { absolutePositionToPercent } from '@/utils/position'
import { Empty, Timeline } from '@tezign/tezign-ui'
import React, { useEffect } from 'react'

const ImageHistory = () => {
  const imageHistory = usePluginStore.use.imageHistory()
  const isEmpty = imageHistory.length === 0

  const onImageClick = (url: string) => {
    const { setInset, setImageSrc } = usePluginStore.getState()

    setImageSrc(url)
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

  const [current, setCurrent] = React.useState<number>()

  useEffect(() => {
    setCurrent(imageHistory.length - 1)
  }, [imageHistory.length])

  const timelines = imageHistory.map(({ timestamp, mode, src }, index) => {
    const isactive = index === current
    return (
      <Timeline.Item key={index} color={isactive ? 'green' : 'gray'}>
        <div className="flex flex-col gap-2">
          <div>
            {mode} -- {new Date(timestamp).toLocaleString()}
          </div>
          <div className="flex flex-row">
            <img
              onClick={() => {
                onImageClick(src)
                setCurrent(index)
              }}
              className="aspect-16/9 w-[40%] cursor-pointer bg-[#f3f5f7] object-scale-down"
              src={src}
            />
          </div>
        </div>
      </Timeline.Item>
    )
  })

  return (
    <div className="max-h-[320px] overflow-y-scroll py-2">
      {isEmpty ? (
        <Empty size="small" description="暂无历史" />
      ) : (
        <Timeline reverse={true}>{timelines}</Timeline>
      )}
    </div>
  )
}

export default ImageHistory
