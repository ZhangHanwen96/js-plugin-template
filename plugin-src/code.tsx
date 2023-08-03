import { isEqual } from 'lodash'
import {
  absolutePositionToPercent,
  percentPositionToAbsolute
} from '@/utils/position'
import type { Rect } from '@/interface'
import { createBgRectangle, createNewFrame, findImageFill } from './util'

export interface Poster {
  width: number
  height: number
}

// image is filled in a <div /> in jsDesign
export interface ImageRectWrapper {
  x: number
  y: number
  width: number
  height: number
}

const IFRAME_WIDTH = 520
const IFRAME_HEIGHT = 460 + 50

jsDesign.showUI(__html__, {
  width: IFRAME_WIDTH,
  height: IFRAME_HEIGHT
})
const HISTORY_KEY = 'tezign-history'

const historyStorage = {
  get(pageId: string) {
    const history = jsDesign.root.getPluginData(HISTORY_KEY)
    try {
      return JSON.parse(history)[pageId]
    } catch (e) {
      console.error(e)
    }
  },
  set(pageId: string, payload: any) {
    const history = historyStorage.get(pageId) || {}
    history[pageId] = payload
    jsDesign.root.setPluginData(HISTORY_KEY, JSON.stringify(history))
  },
  delete(pageId: string) {
    const history = historyStorage.get(pageId)
    if (!history) return
    delete history[pageId]
    jsDesign.root.setPluginData(HISTORY_KEY, JSON.stringify(history))
  }
}

const getPosterNode = () => {
  return jsDesign.currentPage.findOne((node) => node.type === 'FRAME') as
    | FrameNode
    | undefined
}

let posterNode: FrameNode | undefined

const getPluginBgNode = () => {
  return jsDesign.currentPage.findOne(
    (node) => !!node.getPluginData('isBackground')
  ) as RectangleNode | undefined
}

const getDefaultBgNode = () => {
  return jsDesign.currentPage.findOne(
    (node) => node.name === '背景' && node.type === 'RECTANGLE'
  ) as RectangleNode | undefined
}

let bgRectNode: RectangleNode | undefined
let bgRectNodeRect: Rect

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
  }
}

initNodes()

const resetImage = async () => {
  if (!bgRectNode) return
  const imagePaint = findImageFill(bgRectNode)
  if (!imagePaint) return
  try {
    const uint8 = await bgRectNode.exportAsync()
    const { id, name, width, height } = bgRectNode as RectangleNode
    jsDesign.ui.postMessage({
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

const reInitialize = () => {
  initNodes()
  const payload = getPosterAndWrapperRect()
  jsDesign.ui.postMessage({
    type: 'reInitialize',
    payload
  })
}

jsDesign.on('currentpagechange', () => {
  reInitialize()
  resetImage()
})

// sync editor change to plugin
jsDesign.on('selectionchange', () => {
  initNodes(false)
  if (!posterNode || !bgRectNode) {
    jsDesign.ui.postMessage({
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
  // const imageFill = findImageFill(bgRectNode)

  if (isEqual(wrapperRect, bgRectNodeRect)) return

  const containerRect: Rect = {
    x: 0,
    y: 0,
    width: posterNode.width,
    height: posterNode.height
  }
  const pRect = absolutePositionToPercent(wrapperRect, containerRect)

  jsDesign.ui.postMessage({
    type: 'syncEditorToPlugin',
    payload: pRect
  })
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
  Reflect.ownKeys(rect).forEach((key) => {
    bgRectNode[key] = rect[key]
  })
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
  jsDesign.ui.postMessage(
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
    rectangleNode = createBgRectangle()
  }

  const res = await fetch(src)
  const arrayBuffer = await res.arrayBuffer()
  const int8Arr = new Uint8Array(arrayBuffer)
  const img = jsDesign.createImage(int8Arr)

  // 改变节点的填充即可
  rectangleNode.fills = [
    { type: 'IMAGE', scaleMode: 'FILL', imageHash: img.hash }
  ]

  // half width, full height, centered
  rectangleNode.resize(posterNode.width / 2, posterNode.height)
  rectangleNode.x = (posterNode.width - posterNode.width / 2) / 2
  posterNode.appendChild(rectangleNode)

  jsDesign.viewport.scrollAndZoomIntoView([rectangleNode])
}

const handleFirstLoad = () => {
  reInitialize()
}

jsDesign.ui.onmessage = (msg) => {
  const { type, requestId, payload } = msg
  switch (type) {
    case 'firstLoad':
      console.log('firstLoad')
      // iframe -> inited -> ok got you
      // -> iframe should require upload image
      handleFirstLoad()
      break
    case 'manualReInitialize':
      reInitialize()
      resetImage()
      break
    case 'getPosterAndWrapperRect':
      handleGetPosterAndWrapperRectMsg(requestId)
      break
    case 'syncPlugintoEditor':
      syncPluginToEditor(payload)
      break
    case 'uploadImage':
      uploadImage(payload)
  }
}
