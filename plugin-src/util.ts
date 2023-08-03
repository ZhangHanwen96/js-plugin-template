export const createNewFrame = () => {
  const frame = jsDesign.createFrame()
  frame.name = '海报'
  frame.resize(640, 420)
  jsDesign.notify('未检测到Frame，已自动创建', {
    timeout: 3000
  })
  return frame
}

export const createBgRectangle = () => {
  const rectangleNode = jsDesign.createRectangle()
  rectangleNode.name = '背景'
  rectangleNode.setPluginData('isBackground', 'true')
  return rectangleNode
}

export const findImageFill = (rectNode: RectangleNode): ImagePaint | null => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  for (const paint of rectNode.fills) {
    if (paint.type === 'IMAGE') {
      return paint as ImagePaint
    }
  }
  return null
}
