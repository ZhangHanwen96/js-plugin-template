import { Rect } from '@/interface'

export interface ClipImageParams {
  height: number
  width: number
  clipRect?: Rect
  src: string
  name: string
  mimeType: string
}

const loadImage = (url: string) => {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.src = url
    img.onload = () => {
      resolve(img)
    }
    img.onerror = reject
  })
}

export const clipImage = async ({
  clipRect,
  height,
  width,
  src,
  mimeType,
  name
}: ClipImageParams): Promise<File> => {
  const dpr = window.devicePixelRatio || 1
  const canvas = document.createElement('canvas')
  canvas.height = height
  canvas.width = width
  canvas.style.height = height + 'px'
  canvas.style.width = width + 'px'
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  const img = await loadImage(src)

  ctx.drawImage(img, 0, 0, width / dpr, height / dpr)
  clipRect &&
    ctx.clearRect(
      clipRect.x / dpr,
      clipRect.y / dpr,
      clipRect.width / dpr,
      clipRect.height / dpr
    )
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], name, {
          type: mimeType
        })
        resolve(file)
      } else {
        reject('Failed to convert canvas to File')
      }
      canvas.remove()
    })
  })
}
