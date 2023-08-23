import { usePluginStore } from '@/store'
import { message } from '@tezign/tezign-ui'

import { generateExtendAI } from './ai/extend'
import { generateUpscaleAI } from './ai/upscale'
import { generateImage } from './ai/generate'
import { cutImage } from './ai/cut'
import { clipImage } from '@/utils/clipImage'
import { getMimeTypeFromDataUrl } from '@/utils/mime'
import { downloadFile, getExtendDirection, postMessage } from '@/utils'
import { rescaleRect } from '@/utils/scaleImage'
import { captureVisibleBackground } from '@/utils/captureVisibleBackground'

export type ExtendPosition =
  | 'center'
  | 'toTop'
  | 'toBottom'
  | 'toLeft'
  | 'toRight'

export const extendImage = async (
  dataUrl: string,
  {
    width,
    height,
    position,
    quantity = 2
  }: {
    width: number
    height: number
    position: ExtendPosition
    quantity: number
  }
) => {
  try {
    const rescaledRect = rescaleRect(width, height)
    const { uint8 } = await postMessage<{ uint8: Uint8Array }>({
      type: 'viewportImage',
      payload: {
        width: rescaledRect.width,
        height: rescaledRect.height
      }
    })

    const blob = new Blob([uint8], { type: 'image/png' })
    const file = new File([blob], 'rescaled-background.png', {
      type: 'image/png'
    })

    console.log('[extendImage start]')
    console.log('[extendImage generateExtendAI start]')

    const extendsAIFile = await generateExtendAI(file, position)

    console.log('[extendImage generateUpscaleAI start]', extendsAIFile)

    const upscaleAIFile = await generateUpscaleAI(extendsAIFile, width, height)

    console.log('[extendImage generateImage] quantity: ', quantity)

    const generateImages = Array.from({ length: quantity }).map(async () => {
      const genAIFile = await generateImage(
        upscaleAIFile,
        width,
        height,
        position
      )

      const cutAIFile = await cutImage(genAIFile, width, height, position)
      return cutAIFile
    })

    return Promise.all(generateImages)
  } catch (error) {
    console.error(error)
    throw error
  }
  // const genAIFile = await generateImage(upscaleAIFile, width, height, position)
  // console.log('[extendImage cutImage]')
  // const cutAIFile = await cutImage(genAIFile, width, height)
  // console.log('[extendImage end]')
  // return cutAIFile
}

export const getExtendImageSingleBase = async (
  file: File,
  {
    width,
    height,
    position
  }: {
    width: number
    height: number
    position: ExtendPosition
    quantity: number
  }
) => {
  const extendsAIFile = await generateExtendAI(file, position)
  console.log('[extendImage generateUpscaleAI start]', extendsAIFile)

  const upscaleAIFile = await generateUpscaleAI(extendsAIFile, width, height)

  return {
    file: upscaleAIFile,
    width: width,
    height: height,
    position
  }
}

export const extendImageSingle = async (params: {
  file: File
  width: number
  height: number
  position: ExtendPosition
}) => {
  const { file, height, position, width } = params
  console.log('[extendImageSingle] params:', params)
  const genAIFile = await generateImage(
    file,
    Math.round(width),
    Math.round(height),
    position
  )
  downloadFile(genAIFile)
  const cutAIFile = await cutImage(
    genAIFile,
    Math.round(width),
    Math.round(height),
    position
  )
  return cutAIFile
}

export const getExtendAIParam = async () => {
  const { rectBox, scale, inset, imageSrc } = usePluginStore.getState()

  const extendDirection = getExtendDirection()

  if (!extendDirection) {
    message.warn('请先选择扩展方向')
    throw new Error('请先选择扩展方向')
  }

  const imageW = Math.round((rectBox.width - inset.left - inset.right) / scale)
  const imageH = Math.round((rectBox.height - inset.bottom - inset.top) / scale)

  // console.log('[extendImage start]')
  // console.log('[extendImage generateExtendAI start]')

  const rescaledImageRect = rescaleRect(imageW, imageH)
  const rescaledRect = rescaleRect(
    (rectBox.width / scale) * rescaledImageRect.scale,
    (rectBox.height / scale) * rescaledImageRect.scale
  )

  console.log('[rescaledImageRect]', rescaledImageRect)
  console.log('[extendDirection]', extendDirection)
  console.log('[width]', rescaledRect.width)
  console.log('[height]', rescaledRect.height)

  try {
    // HACK: mock cover image
    const blob = await captureVisibleBackground({
      height: rescaledImageRect.height,
      width: rescaledImageRect.width,
      mode: 'cover',
      src: imageSrc
    })
    // const { uint8 } = await postMessage<{ uint8: Uint8Array }>({
    //   type: 'viewportImage',
    //   payload: {
    //     width: rescaledImageRect.width,
    //     height: rescaledImageRect.height
    //   }
    // })

    console.log('[rescaledImageRect]', rescaledImageRect)

    // const blob = new Blob([uint8], { type: 'image/png' })
    const file = new File([blob], `rescaled-bg-${Date.now()}.png`, {
      type: 'image/png'
    })

    downloadFile(file)
    return {
      file,
      width: rescaledRect.width,
      height: rescaledRect.height,
      extendDirection
    }
  } catch (error) {
    console.error(error)
    //  HACK: 是scale满足了512和2048， 但是imagesrc是全图
    const file = await clipImage({
      clipRect: undefined,
      height: rescaledImageRect.height,
      mimeType: getMimeTypeFromDataUrl(imageSrc),
      name: `fallback-rescaled-bg-${Date.now()}.png`,
      width: rescaledImageRect.width,
      src: imageSrc
    })

    downloadFile(file)
    return {
      file,
      // use original image size
      width: rescaledRect.width,
      height: rescaledRect.height,
      extendDirection
    }
  }
}
