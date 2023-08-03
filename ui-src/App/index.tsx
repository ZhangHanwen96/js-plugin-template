import React from 'react'
import './index.scss'
import Background, { rectBoxRef } from '../components/background'
import { DEFAULT_INSET, usePluginStore } from '@/store'
import { useMount } from 'ahooks'
import { Rect } from '@/interface'

const App: React.FC = () => {
  const rectWrapper = usePluginStore.use.rectWrapper?.()
  const shouldRequestUpload = !rectWrapper

  const resetBoundary = () => {
    const { rectBox, inset } = usePluginStore.getState()

    const actualImageRect: Rect = {
      x: rectBox.x + inset.left,
      y: rectBox.y + inset.top,
      width: rectBox.width - inset.left - inset.right,
      height: rectBox.height - inset.top - inset.bottom
    }

    usePluginStore.setState({
      inset: DEFAULT_INSET,
      rectBox: actualImageRect
    })
    rectBoxRef.current = actualImageRect
  }

  useMount(() => {
    parent.postMessage(
      {
        pluginMessage: {
          type: 'firstLoad'
        }
      },
      '*'
    )
  })

  return (
    <div>
      {!shouldRequestUpload ? (
        <div className="container flex h-[460px] w-[520px] flex-col items-center justify-center">
          <Background />
        </div>
      ) : (
        <div className="flex flex-row">
          <span>上传图片</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/gif,image/jpg,image/svg+xml"
            onChange={(e) => {
              const file = e.target.files
              if (file && file[0]) {
                const url = URL.createObjectURL(file[0])
                parent.postMessage(
                  {
                    pluginMessage: {
                      type: 'uploadImage',
                      payload: url
                    }
                  },
                  '*'
                )
                setTimeout(() => {
                  URL.revokeObjectURL(url)
                }, 20_000)
                // TODO: loading status
                setTimeout(() => {
                  parent.postMessage(
                    {
                      pluginMessage: {
                        type: 'manualReInitialize'
                      }
                    },
                    '*'
                  )
                }, 300)
              }
            }}
          />
        </div>
      )}
      {/* reselect */}
      {!shouldRequestUpload && (
        <div className="flex flex-row">
          <input
            type="file"
            accept="image/png,image/jpeg,image/gif,image/jpg,image/svg+xml"
            onChange={(e) => {
              const file = e.target.files
              if (file && file[0]) {
                const url = URL.createObjectURL(file[0])
                parent.postMessage(
                  {
                    pluginMessage: {
                      type: 'uploadImage',
                      payload: url
                    }
                  },
                  '*'
                )
                setTimeout(() => {
                  URL.revokeObjectURL(url)
                }, 20_000)
                // TODO: loading status
                setTimeout(() => {
                  parent.postMessage(
                    {
                      pluginMessage: {
                        type: 'manualReInitialize'
                      }
                    },
                    '*'
                  )
                }, 200)
              }
            }}
          />
          <button onClick={resetBoundary}>Reset Boundary</button>
          <button onClick={() => {}}>Generate</button>
        </div>
      )}
    </div>
  )
}

export default App
