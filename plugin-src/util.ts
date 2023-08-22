export const createNewFrame = () => {
  const frame = figma.createFrame()
  frame.name = '海报'
  // TODO:
  frame.resize(640, 420)
  figma.notify('未检测到Frame，已自动创建')
  return frame
}

export const createBgRectangle = () => {
  const rectangleNode = figma.createRectangle()
  rectangleNode.name = '背景'
  rectangleNode.setPluginData('isBackground', 'true')
  return rectangleNode
}

export const findImageFill = (rectNode: RectangleNode): ImagePaint | null => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  for (const paint of rectNode.fills) {
    if (paint.type === 'IMAGE') {
      const p = paint as ImagePaint
      console.log('scale mode', p.scaleMode)
      return paint as ImagePaint
    }
  }
  return null
}
