export function captureVisibleBackground({
  src,
  height,
  width,
  mode = 'cover'
}: {
  src: string
  width: number
  height: number
  mode: 'cover' | 'contain'
}) {
  const dpr = window.devicePixelRatio || 1
  const divWidth = width
  const divHeight = height
  const divRatio = divWidth / divHeight

  const img = new Image()
  img.src = src

  return new Promise<Blob>((resolve, reject) => {
    img.onload = function () {
      const imgWidth = img.width
      const imgHeight = img.height
      const imgRatio = imgWidth / imgHeight

      let sourceX, sourceY, sourceWidth, sourceHeight
      let destX = 0,
        destY = 0,
        destWidth = divWidth,
        destHeight = divHeight

      if (mode === 'cover') {
        if (imgRatio > divRatio) {
          const scale = divHeight / imgHeight
          sourceWidth = divWidth / scale
          sourceHeight = imgHeight
          sourceX = (imgWidth - sourceWidth) / 2
          sourceY = 0
        } else {
          const scale = divWidth / imgWidth
          sourceWidth = imgWidth
          sourceHeight = divHeight / scale
          sourceX = 0
          sourceY = (imgHeight - sourceHeight) / 2
        }
      } else if (mode === 'contain') {
        if (imgRatio > divRatio) {
          const scale = divWidth / imgWidth
          sourceWidth = imgWidth
          sourceHeight = imgHeight
          sourceX = 0
          sourceY = 0

          destHeight = imgHeight * scale
          destY = (divHeight - imgHeight * scale) / 2
        } else {
          const scale = divHeight / imgHeight
          sourceWidth = imgWidth
          sourceHeight = imgHeight
          sourceX = 0
          sourceY = 0

          destWidth = imgWidth * scale
          destX = (divWidth - imgWidth * scale) / 2
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = divWidth
      canvas.height = divHeight
      canvas.style.width = divWidth + 'px'
      canvas.style.height = divHeight + 'px'
      const ctx = canvas.getContext('2d')
      ctx.scale(1 / dpr, 1 / dpr)

      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        destX * dpr,
        destY * dpr,
        destWidth * dpr,
        destHeight * dpr
      )

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject()
        }
      })
    }
    img.onerror = reject
  })
}
