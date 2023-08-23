import { base64ToDataUrl, dataUrlToFile } from '@/utils'
import { UpScaleImage } from 'jsd-tezign-image'
import { aiProxy } from '../aiProxy'

/**
 * AI 第二步 - 精绘
 * 扩展图 缩放至 目标宽高
 *
 * @param {File} file
 * @return {File}
 */
export const generateUpscaleAI = async (
  file: File,
  width: number,
  height: number
) => {
  // 639 => 64n ceil -> 640
  const upscaleImage = new UpScaleImage(file, width, height, 'repeat')
  // 512 x 512 -> 640 x 640
  const upscaleIns = await upscaleImage.returnParams()
  const { file: upscaleFile, ...extendsParam } = upscaleIns

  console.log('upscaleIns params', upscaleIns)
  const images = await aiProxy({
    api: '/api/diffusion/generate',
    files: [...upscaleFile],
    params: {
      ...extendsParam
    }
  } as any)

  const mime = file.type
  const ext = mime.split('/')[1]

  const upscaleBase64DataUrl = base64ToDataUrl(images[0], ext)
  const upscaleAIFile = await dataUrlToFile(upscaleBase64DataUrl, 'upscale')

  console.log('[upscaleAIFile]', upscaleAIFile)
  return upscaleAIFile
}
