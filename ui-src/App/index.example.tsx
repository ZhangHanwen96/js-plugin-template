import React, { useEffect, useState } from 'react'
import style from './style/index.module.css'
import './index.scss'

interface SelectNode {
  id: string
  name: string
  thumb: Uint8Array
  width: number
  height: number
  thumbSrc: string
}

const App: React.FC = () => {
  const [selectNode, setSelectNode] = useState<SelectNode>()

  const pluginListenerHandler = async (event: MessageEvent<any>) => {
    const pluginMessage = event.data.pluginMessage
    if (!pluginMessage) return
    const { type } = pluginMessage
    switch (type) {
      case 'pluginSelectChange':
        console.log('🚀🚀🚀🚀🚀 ~ pluginMessage:', pluginMessage)

        pluginMessage.data.thumbSrc = URL.createObjectURL(
          new Blob([pluginMessage.data.thumb], { type: 'image/png' })
        )
        setSelectNode(pluginMessage.data)
        break
    }
  }

  useEffect(() => {
    // 向插件侧发送的事件
    parent.postMessage({ pluginMessage: { type: 'firstLoad' } }, '*')

    // 监听插件侧发送过来的事件
    window.addEventListener('message', pluginListenerHandler)
    return () => {
      window.removeEventListener('message', pluginListenerHandler)
    }
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <div className={style.row}>
        <span>输入框</span>
        <input
          placeholder="输入内容与画布文字节点同步"
          onChange={(e) => {
            const value = e.target.value
            parent.postMessage(
              { pluginMessage: { type: 'updateFont', data: value } },
              '*'
            )
          }}
          style={{ width: '100%' }}
        />
      </div>

      <div className={style.row}>
        <span>当前选中节点缩略图</span>
        {selectNode && (
          <img className={style.thumbnail} src={selectNode.thumbSrc} />
        )}
      </div>

      <div className={style.row}>
        <span>上传图片</span>
        <input
          type="file"
          accept="image/png"
          onChange={(e) => {
            const file = e.target.files
            if (file && file[0]) {
              parent.postMessage(
                {
                  pluginMessage: {
                    type: 'uploadImage',
                    src: URL.createObjectURL(file[0])
                  }
                },
                '*'
              )
            }
          }}
        />
      </div>
    </div>
  )
}

export default App
