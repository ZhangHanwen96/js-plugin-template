import React, { FC, useMemo, useRef } from 'react'
import './index.scss'
import Background from '../components/background'
import { usePluginStore } from '@/store'
import { useMount } from 'ahooks'
import { UploadOutlined, HistoryOutlined } from '@tezign/icons'

import { Accept, useDropzone } from 'react-dropzone'
import { delay, fileToUrl, postMessage } from '@/utils'
import ImageList from '@/components/image-list'
import { Alert, Button, Empty, Popover, Tabs, TzSpin } from '@tezign/tezign-ui'
import { useExtraStore } from '@/store/extra'
import ImageHistory from '@/components/image-history'
import { Mode } from '@/interface'
const imageId = ['HXW26Gw8bk4', 'ACoZwVwjElU', 'bp1qQfAQOXw']
const upsplashUrl = 'https://source.unsplash.com'

export const getCustomImageUrl = (width: number, height: number) => {
  const id = imageId[Math.floor(Math.random() * imageId.length)]
  const url = `${upsplashUrl}/${id}`
  return `${url}/${width}x${height}`
}
const baseStyle: React.CSSProperties = {
  borderWidth: 2,
  borderRadius: 2,
  borderColor: 'transparent',
  borderStyle: 'dashed',
  color: 'transparent',
  outline: 'none',
  transition: 'border .24s ease-in-out'
}

const focusedStyle = {
  borderColor: '#2196f3'
}

const acceptStyle = {
  borderColor: '#00e676'
}

const rejectStyle = {
  borderColor: '#ff1744'
}

const TipBanner: FC<{ tab: Mode }> = ({ tab }) => {
  const message =
    tab === 'extend'
      ? '可在画板中调整好位置，然后在插件中拖动虚线选择延展范围'
      : '请在插件中拖动虚线框，框柱需要重新绘制的区域'

  return (
    <Alert
      message={message}
      type="info"
      closable
      showIcon={true}
      // afterClose={handleClose}
    />
  )
}

const loadImage = (url: string) => {
  return new Promise<string>((resolve, reject) => {
    const img = new Image()
    img.src = url
    img.onload = () => {
      resolve(url)
    }
    img.onerror = reject
  })
}

export const image: Accept = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/gif': ['.gif'],
  'image/bmp': ['.bmp'],
  'image/webp': ['.webp'],
  'image/svg+xml': ['.svg']
}

const TabPane = Tabs.TabPane

const App: React.FC = () => {
  const rectWrapper = usePluginStore.use.rectWrapper?.()
  const setImageSrc = usePluginStore.use.setImageSrc()
  const setTab = useExtraStore.use.setTab()
  const tab = useExtraStore.use.tab()

  const imageListRef = useRef<any>()

  const [loadingState, setLoadingState] = React.useState({
    uploading: false
  })

  const tabs = () => {
    return (
      <Tabs defaultActiveKey={tab} onChange={(v) => setTab(v as any)}>
        <TabPane tab="智能延展" key="extend" tabKey="extend"></TabPane>
        <TabPane
          tab="智能重绘"
          key="partialRedraw"
          tabKey="partialRedraw"
        ></TabPane>
      </Tabs>
    )
  }

  // REFACTOR: to imageSrc
  const shouldRequestUpload = !rectWrapper

  const generateDrawing = () => {
    imageListRef.current.generateImage()
  }

  useMount(() => {
    parent.postMessage(
      {
        pluginMessage: {
          type: 'firstLoad'
        }
      },
      '*'
    )
  })

  const {
    getRootProps,
    getInputProps,
    isFocused,
    isDragAccept,
    isDragReject,
    open

    // acceptedFiles
  } = useDropzone({
    accept: {
      ...image
    },
    noKeyboard: true,
    noClick: true,
    multiple: false,
    // maxSize: MAX_SIZE,
    onDropAccepted(files) {
      if (!files.length) return
      handleImageUpload(files[0])
    }
  })

  const dropzoneStyle = useMemo(
    () =>
      ({
        ...baseStyle,
        ...(isFocused ? focusedStyle : {}),
        ...(isDragAccept ? acceptStyle : {}),
        ...(isDragReject ? rejectStyle : {})
        // ...(customActive ? acceptStyle : {})
      }) as any,
    [isFocused, isDragAccept, isDragReject]
  )

  const handleImageUpload = async (file: File) => {
    // const file = e.target.files?.[0]
    if (file) {
      // const reader = new FileReader()
      // reader.readAsDataURL(file)
      const url = await fileToUrl(file)

      setImageSrc(url as string)
      usePluginStore.setState({
        imageFile: file
      })
      parent.postMessage(
        {
          pluginMessage: {
            type: 'uploadImage',
            payload: url
          }
        },
        '*'
      )
      setLoadingState((pre) => ({ ...pre, uploading: true }))

      await delay(2500)

      const responsePromise = postMessage({
        type: 'manualReInitialize'
      })

      try {
        await responsePromise
      } catch (error) {
        console.error(error)
      } finally {
        setLoadingState((pre) => ({ ...pre, uploading: false }))
      }
    }
  }

  return (
    <div>
      <div className="mb-2 px-3">
        <div className="relative flex flex-col justify-between">
          {tabs()}
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <Button onClick={open} icon={<UploadOutlined />}>
              上传图片
            </Button>
          </div>
        </div>
      </div>
      <div className="mb-3 px-3">
        <TipBanner tab={tab} />
      </div>
      <div
        {...getRootProps({})}
        // roughly 460-80-120 | 520
        className="container relative flex h-[calc(460px-80px-120px)] w-full flex-col px-3"
      >
        {!shouldRequestUpload && <Background />}
        {shouldRequestUpload && (
          <div
            onClick={open}
            className="flex h-full w-full items-center justify-center"
          >
            <Empty
              image={Empty.IMAGES.NO_PICTURE}
              description="未匹配上背景图，请检查待延展图片命名是否是“背景”"
            />
          </div>
        )}

        {loadingState.uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-300/30 backdrop-blur-[2px]">
            <TzSpin size="small" />
          </div>
        )}

        <input {...getInputProps({})} />
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={dropzoneStyle}
        ></div>
      </div>

      <ImageList ref={imageListRef} />

      <div
        className="mt-auto flex justify-between p-3"
        style={{
          borderTop: '1px solid #DCE1E5'
        }}
      >
        <Popover
          placement="bottomLeft"
          title="历史记录"
          content={<ImageHistory />}
        >
          <Button type="default" icon={<HistoryOutlined />}></Button>
        </Popover>
        <Button onClick={generateDrawing}>生成</Button>
      </div>
    </div>
  )
}

export default App
