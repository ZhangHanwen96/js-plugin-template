jsDesign.showUI(__html__, {
  width: 520,
  height: 560
})

// 监听UI测传过来的事件
jsDesign.ui.onmessage = (msg) => {
  const { type } = msg
  //   switch (type) {
  //     case 'firstLoad':
  //       pluginSelectHandle()
  //       break
  //     case 'updateFont':
  //       updateFont(msg.data)
  //       break
  //     case 'uploadImage':
  //       uploadImage(msg.src)
  //       break
  //   }
}

// 监听选中节点改变
jsDesign.on('selectionchange', () => {
  const posterFrame = jsDesign.currentPage.findOne(
    (node) => node.type === 'FRAME'
  )
})
