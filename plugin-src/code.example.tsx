// 展示UI
jsDesign.showUI(__html__, {
  width: 520,
  height: 560
})

// 监听UI测传过来的事件
jsDesign.ui.onmessage = (msg) => {
  const { type } = msg
  switch (type) {
    case 'firstLoad':
      pluginSelectHandle()
      break
    case 'updateFont':
      updateFont(msg.data)
      break
    case 'uploadImage':
      uploadImage(msg.src)
      break
  }
}

// 监听选中节点改变
jsDesign.on('selectionchange', () => {
  pluginSelectHandle()
})

/**
 * @description 画布选中节点
 */
const pluginSelectHandle = () => {
  // 当前选中节点
  const select = jsDesign.currentPage.selection[0]

  if (select) {
    // 导出选中节点的缩略图，为Uint8Array 格式数据
    select.exportAsync().then((uint8) => {
      const { id, name, width, height } = select
      jsDesign.ui.postMessage({
        type: 'pluginSelectChange',
        data: {
          id,
          name,
          width,
          height,
          thumb: uint8
        }
      })
    })
  }
}

/**
 * @description 更新文字节点
 */
const updateFont = async (content: string) => {
  // 寻找目标节点
  let textNode = jsDesign.currentPage.findOne(
    (item) => !!item.getPluginData('createByPlugin')
  ) as TextNode

  // 如果没有文字节点，则新建
  if (!textNode) {
    textNode = jsDesign.createText()
    textNode.setPluginData('createByPlugin', '1')
  }

  // 讲文字节点移动至当前视图当中
  jsDesign.viewport.scrollAndZoomIntoView([textNode])

  // 改文字内容必须先加载字体
  await jsDesign.loadFontAsync(textNode.fontName as FontName)
  textNode.characters = content

  console.log('update finish')
}

/**
 * @description 上传图片节点
 */
const uploadImage = async (src: string) => {
  // 寻找目标背景节点
  let rectangleNode = jsDesign.currentPage.findOne(
    (item) => !!item.getPluginData('isBackground')
  ) as RectangleNode

  // 如果没有背景节点，则新建
  if (!rectangleNode) {
    rectangleNode = jsDesign.createRectangle()
    rectangleNode.setPluginData('isBackground', '1')
  }

  // 可以改变举行节点的属性
  // rectangleNode.x = 100;
  // rectangleNode.y = 100;
  // rectangleNode.resize(200,200);

  // 创建一个Image对象
  const res = await fetch(src)
  const arrayBuffer = await res.arrayBuffer()
  const int8Arr = new Uint8Array(arrayBuffer)
  const img = jsDesign.createImage(int8Arr)

  // 改变节点的填充即可
  rectangleNode.fills = [
    { type: 'IMAGE', scaleMode: 'FIT', imageHash: img.hash }
  ]

  // 将矩形节点移动至当前视图当中
  jsDesign.viewport.scrollAndZoomIntoView([rectangleNode])

  console.log('update image finish')
}
