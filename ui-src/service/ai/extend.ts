import { getMimeTypeFromDataUrl } from '@/utils/mime'
import { ExtendImage } from 'jsd-tezign-image'
import { aiProxy } from '../aiProxy'
import { base64ToDataUrl, dataUrlToFile } from '@/utils'

/**
 * AI 第一步 - 扩展
 *
 * @param {File} file
 * @return {File}
 */
export const generateExtendAI = async (file: File) => {
  // const mimeType = getMimeTypeFromDataUrl(dataUrl)
  // const file = await dataUrlToFile(dataUrl, 'original')
  const mimeType = file.type
  // console.log('11111', file)
  // console.log(dataUrl)
  const extendImage = new ExtendImage(file, 'repeat', 'center')
  // console.log('222222')
  const extendIns = await extendImage.returnParams()
  // console.log('3333333')
  const { file: extendsFile, ...extendsParam } = extendIns
  // console.log('4444444', extendIns)

  try {
    const extendImages = await aiProxy({
      api: '/api/diffusion/generate',
      files: [...extendsFile],
      params: {
        ...extendsParam
      }
    } as any)
    // console.log('5555555')
    const extendsBase64 = base64ToDataUrl(
      extendImages[0],
      mimeType.split('/')[1]
    )
    const extendsAIFile = await dataUrlToFile(extendsBase64, 'extends')

    console.log('[extendsAIFile]', extendsAIFile)
    return extendsAIFile
  } catch (error) {
    console.log('666666666')
    console.error('error', error)
  }
}
