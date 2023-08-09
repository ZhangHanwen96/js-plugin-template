import React, { useMemo, useRef } from 'react'
import './index.scss'
import Background from '../components/background'
import { usePluginStore } from '@/store'
import { useMount } from 'ahooks'
import { UploadOutlined } from '@tezign/icons'

import { Accept, useDropzone } from 'react-dropzone'
import { delay, postMessage } from '@/utils'
import ImageList from '@/components/image-list'
import { Alert, Button, Tabs, Upload } from '@tezign/tezign-ui'
import { useExtraStore } from '@/store/extra'

const upsplashUrl = 'https://source.unsplash.com/ACoZwVwjElU'
export const getCustomImageUrl = (width: number, height: number) => {
  return `${upsplashUrl}/${width}x${height}`
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

const loadImage = (url: string) => {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.src = url
    img.onload = () => {
      resolve(img)
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
        <TabPane tab="extend" key="extend"></TabPane>
        <TabPane tab="partialRedraw" key="partialRedraw"></TabPane>
      </Tabs>
    )
  }

  // REFACTOR: to imageSrc
  const shouldRequestUpload = !rectWrapper

  const generateDrawing = () => {
    imageListRef.current.generateImage()
    // const { rectBox, scale } = usePluginStore.getState()

    // const urls = Array.from({ length: 3 }).map(() =>
    //   getCustomImageUrl(
    //     Math.round(rectBox.width / scale),
    //     Math.round(rectBox.height / scale)
    //   )
    // )
    // setImages(urls)
  }

  // const onImageClick = (url: string) => {
  //   const { setInset, setImageSrc } = usePluginStore.getState()

  //   // const url = getCustomImageUrl(
  //   //   Math.round(rectBox.width / scale),
  //   //   Math.round(rectBox.height / scale)
  //   // )

  //   // restore to image size to rectBox size
  //   // loadImage(url).then(() => {
  //   setImageSrc(url)
  //   setInset(DEFAULT_INSET)
  //   // })

  //   const poster = document.getElementById('poster')

  //   const pRect = absolutePositionToPercent(
  //     rectBoxRef.current,
  //     poster!.getBoundingClientRect()
  //   )

  //   parent.postMessage(
  //     {
  //       pluginMessage: {
  //         type: 'updateImage',
  //         payload: {
  //           src: url,
  //           rect: pRect
  //         }
  //       }
  //     },
  //     '*'
  //   )
  //   // setTimeout(() => {
  //   //   parent.postMessage(
  //   //     {
  //   //       pluginMessage: {
  //   //         type: 'manualReInitialize'
  //   //       }
  //   //     },
  //   //     '*'
  //   //   )
  //   // }, 300)
  // }

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

  const handleImageUpload = (file: File) => {
    // const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = async () => {
        const url = reader.result
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
  }
  return (
    <div>
      <div className="relative flex flex-col justify-between">
        {tabs()}
        <div className="absolute right-0 top-0">
          <Button onClick={open} icon={<UploadOutlined />}>
            上传图片
          </Button>
        </div>
      </div>
      <div>
        {true ? (
          <Alert
            message="Alert Message Text"
            type="warning"
            closable
            // afterClose={handleClose}
          />
        ) : null}
      </div>
      <div
        {...getRootProps({})}
        // 460 520-80
        className="container relative flex h-[calc(460px-80px-120px)] w-[520px] flex-col bg-[#F3F5F7] px-8 pt-4"
      >
        {!shouldRequestUpload && <Background />}
        {shouldRequestUpload && (
          <div
            onClick={open}
            className="flex h-full w-full items-center justify-center"
          >
            上传图片
          </div>
        )}

        {loadingState.uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-300/30 backdrop-blur-[2px]">
            Loading
          </div>
        )}

        <input {...getInputProps()} />
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={dropzoneStyle}
        ></div>
      </div>

      <ImageList ref={imageListRef} />

      <div className="mt-auto">
        <Button onClick={generateDrawing}>Save</Button>
      </div>
    </div>
  )
}

export default App
