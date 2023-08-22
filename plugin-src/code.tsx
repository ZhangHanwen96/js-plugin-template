import { isEqual, uniqueId } from 'lodash'
import {
  absolutePositionToPercent,
  percentPositionToAbsolute
} from '@/utils/position'
import type { Rect } from '@/interface'
import Pubsub from './pubsub'
import { createBgRectangle, createNewFrame, findImageFill } from './util'

export interface Poster {
  width: number
  height: number
}

// image is filled in a <div /> in figma
export interface ImageRectWrapper {
  x: number
  y: number
  width: number
  height: number
}

const IFRAME_WIDTH = 520
const IFRAME_HEIGHT = 460 + 50

figma.showUI(__html__, {
  width: IFRAME_WIDTH,
  height: IFRAME_HEIGHT
})
const HISTORY_KEY = 'tezign-history'

// const historyStorage = {
//   get(pageId: string) {
//     const history = figma.root.getPluginData(HISTORY_KEY)
//     try {
//       return JSON.parse(history)[pageId]
//     } catch (e) {
//       console.error(e)
//     }
//   },
//   set(pageId: string, payload: any) {
//     const history = historyStorage.get(pageId) || {}
//     history[pageId] = payload
//     figma.root.setPluginData(HISTORY_KEY, JSON.stringify(history))
//   },
//   delete(pageId: string) {
//     const history = historyStorage.get(pageId)
//     if (!history) return
//     delete history[pageId]
//     figma.root.setPluginData(HISTORY_KEY, JSON.stringify(history))
//   }
// }

const storage = {
  get(key?: string) {
    const history = figma.root.getPluginData(HISTORY_KEY)
    try {
      const h = JSON.parse(history)
      return key ? h[key] : h
    } catch (e) {
      console.error(e)
      return null
    }
  },
  set(key: string, value: string) {
    const history = storage.get() || {}
    history[key] = value
    try {
      figma.root.setPluginData(HISTORY_KEY, JSON.stringify(history))
    } catch (error) {
      console.error(error)
    }
  },
  delete(key: string) {
    try {
      const history = storage.get()
      delete history[key]
      figma.root.setPluginData(HISTORY_KEY, JSON.stringify(history))
    } catch (error) {}
  }
}

const getPosterNode = () => {
  return figma.currentPage.findOne((node) => node.type === 'FRAME') as
    | FrameNode
    | undefined
}

let posterNode: FrameNode | undefined

const getDefaultBgNode = () => {
  return figma.currentPage.findOne(
    (node) => node.name === '背景' && node.type === 'RECTANGLE'
  ) as RectangleNode | undefined
}

const getPluginBgNode = () => {
  const pluginNode = figma.currentPage.findOne(
    (node) => !!node.getPluginData('isBackground')
  ) as RectangleNode | undefined
  if (pluginNode) return pluginNode
  return null

  const defaultNode = getDefaultBgNode()
  if (!defaultNode) return null
  defaultNode.setPluginData('isBackground', 'true')
  return pluginNode
}

let bgRectNode: RectangleNode | undefined
let bgRectNodeRect: Rect
let imageHash: string

const initNodes = (resetRect = true) => {
  posterNode = getPosterNode()
  bgRectNode = getPluginBgNode()
  if (bgRectNode && resetRect) {
    bgRectNodeRect = {
      x: bgRectNode.x,
      y: bgRectNode.y,
      width: bgRectNode.width,
      height: bgRectNode.height
    }
    imageHash = (bgRectNode.fills[0] as ImagePaint)?.imageHash
  }
}

initNodes()

const resetImage = async () => {
  if (!bgRectNode) return
  const imagePaint = findImageFill(bgRectNode)
  if (!imagePaint) return
  try {
    // const uint8 = await bgRectNode.exportAsync({
    //   format: 'PNG',
    //   constraint: {
    //     type: 'WIDTH',
    //     value: 200
    //   }
    // })
    const imageNode = figma.getImageByHash(imagePaint.imageHash)
    const uint8 = await imageNode.getBytesAsync()
    const { id, name, width, height } = bgRectNode as RectangleNode
    figma.ui.postMessage({
      type: 'resetImage',
      payload: {
        id,
        name,
        width,
        height,
        thumb: uint8
      }
    })
  } catch (error) {
    console.error(error)
  }
}

const reInitialize = (requestId?: string) => {
  initNodes()
  const payload = getPosterAndWrapperRect()
  figma.ui.postMessage({
    type: 'reInitialize',
    payload,
    requestId
  })
}

const eventPubsub = new Pubsub()

const postMessage = async (pluginMessage: any) => {
  const requestId = uniqueId()
  figma.ui.postMessage(
    {
      ...pluginMessage,
      requestId
    },
    {
      origin: '*'
    }
  )
  const responsePromise = new Promise((resolve, reject) => {
    eventPubsub.once(requestId, (data) => {
      resolve(data)
    })
    setTimeout(() => {
      reject(new Error('timeout'))
    }, 5_000)
  })

  return responsePromise
}

let $preventReinit = false

figma.on('currentpagechange', async () => {
  try {
    $preventReinit = true
    const response = await postMessage({
      type: 'currentpagechange'
    })
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (response?.confirm) {
      // TODO: ask iframe for confirmation
      reInitialize()
      resetImage()
    }
  } catch (error) {
    console.error(error)
  } finally {
    $preventReinit = false
  }
})

// sync editor change to plugin
// NOTE: in figma dragging will not trigger this event
figma.on('selectionchange', () => {
  if ($preventReinit) return
  initNodes(false)

  if (!posterNode || !bgRectNode) {
    figma.ui.postMessage({
      type: 'reInitialize',
      payload: null
    })
    return
  }

  const wrapperRect: Rect = {
    x: bgRectNode.x,
    y: bgRectNode.y,
    width: bgRectNode.width,
    height: bgRectNode.height
  }

  if (!isEqual(wrapperRect, bgRectNodeRect)) {
    const containerRect: Rect = {
      x: 0,
      y: 0,
      width: posterNode.width,
      height: posterNode.height
    }
    const pRect = absolutePositionToPercent(wrapperRect, containerRect)

    figma.ui.postMessage({
      type: 'syncEditorToPlugin',
      payload: pRect
    })
  }

  const currentImageHash = (bgRectNode.fills[0] as ImagePaint)?.imageHash
  if (currentImageHash && imageHash !== currentImageHash) {
    imageHash = currentImageHash
    // resetImage()
  }

  initNodes()
})

/**
 *
 * @param pRect percentage rect, not PX
 */
const syncPluginToEditor = (pRect: Rect) => {
  if (!posterNode || !bgRectNode) return
  const posterRect = {
    width: posterNode.width,
    height: posterNode.height,
    x: 0,
    y: 0
  }
  const rect = percentPositionToAbsolute(pRect, posterRect)

  bgRectNode.x = rect.x
  bgRectNode.y = rect.y
  bgRectNode.resize(rect.width, rect.height)
  // avoid next [syncEditorToPlugin] triggered by selectionchane
  // HACK
  bgRectNodeRect = {
    ...rect
  }
}

function getPosterAndWrapperRect() {
  if (!posterNode || !bgRectNode) return null
  const posterRect: Poster = {
    height: posterNode.height,
    width: posterNode.width
  }
  const bgRect: ImageRectWrapper = {
    height: bgRectNode.height,
    width: bgRectNode.width,
    x: bgRectNode.x,
    y: bgRectNode.y
  }

  const payload = {
    imageWrapperRect: bgRect,
    poster: posterRect
  }

  return payload
}

const handleGetPosterAndWrapperRectMsg = (requestId: string) => {
  figma.ui.postMessage(
    {
      requestId,
      payload: getPosterAndWrapperRect()
    },
    {
      origin: '*'
    }
  )
  resetImage()
}

/**
 * @description 上传图片节点
 */
const uploadImage = async (src: string) => {
  let posterNode = getPosterNode()
  if (!posterNode) {
    posterNode = createNewFrame()
  }

  let rectangleNode = getPluginBgNode()
  if (!rectangleNode) {
    // use default template node whose name is '背景'
    // or create new one otherwise
    const _default_node = getDefaultBgNode()
    if (_default_node) {
      rectangleNode = _default_node
      rectangleNode.setPluginData('isBackground', 'true')
    } else {
      rectangleNode = createBgRectangle()
    }
  }

  const res = await fetch(src)
  const arrayBuffer = await res.arrayBuffer()
  const int8Arr = new Uint8Array(arrayBuffer)
  const img = figma.createImage(int8Arr)

  // 改变节点的填充即可
  rectangleNode.fills = [
    { type: 'IMAGE', scaleMode: 'FILL', imageHash: img.hash }
  ]

  // half width, full height, centered
  rectangleNode.resize(posterNode.width / 2, posterNode.height)
  rectangleNode.x = (posterNode.width - posterNode.width / 2) / 2
  rectangleNode.y = 0
  posterNode.appendChild(rectangleNode)

  figma.viewport.scrollAndZoomIntoView([rectangleNode])

  figma.currentPage.selection = [rectangleNode]

  initNodes()
}

const handleFirstLoad = () => {
  reInitialize()
  try {
    const history = storage.get() || {}
    figma.ui.postMessage({
      type: 'syncStorage',
      payload: history
    })
  } catch (error) {}
}

const updateImage = async ({
  src,
  rect: pRect
}: {
  src: string
  rect: Rect
}) => {
  const posterNode = getPosterNode()
  if (!posterNode) {
    return
  }
  const rectangleNode = getPluginBgNode()
  if (!rectangleNode) {
    return
  }

  // sync size
  syncPluginToEditor(pRect)

  const res = await fetch(src)
  const arrayBuffer = await res.arrayBuffer()
  const int8Arr = new Uint8Array(arrayBuffer)
  const img = figma.createImage(int8Arr)
  rectangleNode.fills = [
    { type: 'IMAGE', scaleMode: 'FILL', imageHash: img.hash }
  ]

  reInitialize()
  // resetImage()
}

const handleStorage = (payload: {
  type: 'get' | 'set' | 'delete'
  params: any[]
}) => {
  const func = storage[payload.type]
  try {
    func.apply(storage, payload.params)
  } catch (error) {
    console.error(error)
  }
}

const handleViewportImage = async (
  requestId: string,
  payload: {
    height: number
    width: number
    format: 'PNG' | 'JPG'
  }
) => {
  console.log(11111)
  if (!bgRectNode) return
  console.log(22222)
  const imagePaint = findImageFill(bgRectNode)
  if (!imagePaint) return
  console.log(333333)
  const { width } = payload
  console.log('exportAsync width', width)
  const uint8 = await bgRectNode.exportAsync({
    format: 'PNG',
    constraint: {
      type: 'WIDTH',
      value: width
    }
  })
  console.log('exportAsync done')

  figma.ui.postMessage(
    {
      requestId,
      type: 'viewportImage:response',
      payload: {
        uint8: uint8 as Uint8Array
      }
    },
    {
      origin: '*'
    }
  )
}

figma.ui.onmessage = (msg) => {
  const { type, requestId, payload } = msg
  console.log(
    '%c[MAIN] type: ' + type,
    'color: blue; font-weight: bold; font-size: 16px'
  )
  switch (type) {
    case 'firstLoad':
      // iframe -> inited -> ok got you
      // -> iframe should require upload image
      handleFirstLoad()
      break
    case 'manualReInitialize':
      reInitialize(requestId)
      // resetImage()
      break
    case 'getPosterAndWrapperRect':
      handleGetPosterAndWrapperRectMsg(requestId)
      break
    case 'syncPlugintoEditor':
      syncPluginToEditor(payload)
      break
    case 'uploadImage':
      uploadImage(payload)
      break
    case 'updateImage':
      updateImage(payload)
      break
    case 'storage':
      handleStorage(payload)
      break
    case 'viewportImage':
      handleViewportImage(requestId, payload)
      break
    default:
      requestId && eventPubsub.notify(requestId, payload)
  }
}
