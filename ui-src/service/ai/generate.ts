import { GenerateImage } from 'jsd-tezign-image'
import { aiProxy } from '../aiProxy'

/**
 * AI 第三步 - 生成
 * 精绘图 生成 内容
 *
 * @param {File} file
 * @return {File}
 */
export const generateImage = async (
  file: File,
  width: number,
  height: number,
  position: 'center' | 'toTop' | 'toBottom' | 'toLeft' | 'toRight'
) => {
  const genImage = new GenerateImage(file, width, height, position)

  const genIns = await genImage.returnParams()
  const { file: genFile, ...extendsParam } = genIns
  const genFileIns = genFile[0]

  const mime = genFileIns.type
  const ext = mime.split('/')[1]
  // const mime = getMimeTypeFromFileName(genFileIns.mim)
  // const files = genFile.map((f) => {
  //   return new File([f], 'tszign.png', {
  //     type: f.type,
  //     lastModified: f.lastModified
  //   })
  // })
  // genIns.file = files
  console.log('gererateImage param', genIns)

  const images = await aiProxy({
    params: {
      ...extendsParam
    },
    api: '/api/diffusion/generate',
    files: [...genFile]
  } as any)

  const genBase64 = `data:image/${ext};base64,` + images[0]
  const genAIBlob = await (await fetch(genBase64)).blob()
  const genAIFile = new File([genAIBlob], `generate.${ext}`, {
    type: mime
  })

  console.log('%c[genAIFile]', genAIFile)

  return genAIFile
}
