import { rectBoxRef, usePluginStore } from '@/store'
import { ClipImageParams, clipImage } from '@/utils/clipImage'
// import { getBoxselectPercentageRect } from '@/utils/position'
import { AIProxyParams, aiProxy } from './aiProxy'
import { useExtraStore } from '@/store/extra'
import { absolutePositionToPercent } from '@/utils/position'
import { getMimeTypeFromDataUrl } from '@/utils/mime'
import { rescaleRect } from '@/utils/scaleImage'
import { downloadFile, fileToUrl, postMessage } from '@/utils'

const getBoxselectPercentageRect = () => {
  const rect = useExtraStore.getState().boxSelectDivStyle
  const right = Math.min(
    rect.x + rect.width,
    rectBoxRef.current.x + rectBoxRef.current.width
  )
  const bottom = Math.min(
    rect.y + rect.height,
    rectBoxRef.current.height + rectBoxRef.current.y
  )
  const left = Math.max(rect.x, rectBoxRef.current.x)
  const top = Math.max(rect.y, rectBoxRef.current.y)
  const intersectionRect = {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top
  }

  const relativeIntersectionRectToImage = {
    ...intersectionRect,
    x: intersectionRect.x - rectBoxRef.current.x,
    y: intersectionRect.y - rectBoxRef.current.y
  }

  const percentageRect = absolutePositionToPercent(
    relativeIntersectionRectToImage,
    {
      x: 0,
      y: 0,
      width: rectBoxRef.current.width,
      height: rectBoxRef.current.height
    }
  )

  return percentageRect
}

export const getPartialRedrawParams = async () => {
  const { rectBox, scale, imageSrc: _imageSrc } = usePluginStore.getState()
  const pRect = getBoxselectPercentageRect()
  // console.log('[getBoxselectPercentageRect]: ,', pRect)
  // console.log('[rectBox]: ,', rectBox, scale)

  let height = rectBox.height / scale
  let width = rectBox.width / scale

  const rescaledRect = rescaleRect(width, height)
  height = rescaledRect.height
  width = rescaledRect.width
  console.log('rescaledRect', rescaledRect)

  try {
    const { uint8 } = await postMessage<{ uint8: Uint8Array }>({
      type: 'viewportImage',
      payload: {
        width,
        height
      }
    })

    const rescaledPartialBlob = new Blob([uint8], { type: 'image/png' })
    const rescaledPartialFile = new File(
      [rescaledPartialBlob],
      'rescaled-partial-background.png',
      {
        type: 'image/png'
      }
    )

    const imageSrc = await fileToUrl(rescaledPartialFile)
    const param = {
      height,
      width,
      src: imageSrc,
      clipRect: {
        width: pRect.width * width,
        height: pRect.height * height,
        x: pRect.x * width,
        y: pRect.y * height
      }
    }
    console.log('[partialRedraw]: ', param)

    const mimeType = getMimeTypeFromDataUrl(imageSrc)
    const ext = mimeType.split('/')[1]
    const partialFile = await clipImage({
      ...param,
      mimeType,
      name: `clip-bg.${ext}`
    })

    downloadFile(partialFile)

    return {
      files: [rescaledPartialFile, partialFile],
      api: '/api/diffusion/generate',
      params: {
        model: 'sd-v1-5-pruned-emaonly',
        model_variant: 'inpainting',
        image: '0',
        mask: '1',
        height,
        width,
        strength: '0.95'
      }
    }
  } catch (error) {
    console.error(error)
    // TODO: scale with UpscaleAI

    const height = rectBox.height / scale
    const width = rectBox.width / scale
    const param = {
      height,
      width,
      src: _imageSrc,
      clipRect: {
        width: pRect.width * width,
        height: pRect.height * height,
        x: pRect.x * width,
        y: pRect.y * height
      }
    }
    console.log('[partialRedraw]: ', param)

    const mimeType = getMimeTypeFromDataUrl(_imageSrc)
    const ext = mimeType.split('/')[1]
    const partialFile = await clipImage({
      ...param,
      mimeType,
      name: `clip-bg.${ext}`
    })

    downloadFile(partialFile)

    const blob = await fetch(_imageSrc).then((res) => res.blob())
    const file = new File([blob], `background.${ext}`, { type: mimeType })

    return {
      files: [file, partialFile],
      api: '/api/diffusion/generate',
      params: {
        model: 'sd-v1-5-pruned-emaonly',
        model_variant: 'inpainting',
        image: '0',
        mask: '1',
        height,
        width,
        strength: '0.95'
      }
    }
  }
}

export const partialRedraw = async (params: AIProxyParams) => {
  const generateRes = await aiProxy(params)

  return generateRes
}
