import { ExtendImage } from 'jsd-tezign-image'
import { aiProxy } from '../aiProxy'
import { base64ToDataUrl, dataUrlToFile } from '@/utils'
import { ExtendPosition } from '../extendImage'

/**
 * AI 第一步 - 扩展
 *
 * @param {File} file
 * @return {File}
 */
export const generateExtendAI = async (
  file: File,
  position: ExtendPosition
) => {
  // const mimeType = getMimeTypeFromDataUrl(dataUrl)
  // const file = await dataUrlToFile(dataUrl, 'original')
  const mimeType = file.type
  const extendImage = new ExtendImage(file, 'repeat', position)
  const extendIns = await extendImage.returnParams()
  const { file: extendsFile, ...extendsParam } = extendIns

  try {
    const extendImages = await aiProxy({
      api: '/api/diffusion/generate',
      files: [...extendsFile],
      params: {
        ...extendsParam
      }
    } as any)
    const extendsBase64 = base64ToDataUrl(
      extendImages[0],
      mimeType.split('/')[1]
    )
    const extendsAIFile = await dataUrlToFile(extendsBase64, 'extends')

    console.log('[extendsAIFile]', extendsAIFile)
    return extendsAIFile
  } catch (error) {
    console.error('error', error)
  }
}
