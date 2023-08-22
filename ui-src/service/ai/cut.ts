import { CutImage } from 'jsd-tezign-image'

/**
 * AI 第四步 - 裁切
 * 裁切图片
 *
 * @param {File} file
 * @return {File}
 */
export const cutImage = async (file: File, width: number, height: number) => {
  const mime = file.type
  const ext = mime.split('/')[1]
  const cutStep = new CutImage(file, width, height, 'repeat')
  const cutIns = await cutStep.returnParams()
  const cutAIFile = new File([cutIns], `cut.${ext}`, {
    type: file.type
  })
  return cutAIFile
}
