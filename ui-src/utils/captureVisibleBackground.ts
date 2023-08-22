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
  const divWidth = width
  const divHeight = height
  const divRatio = divWidth / divHeight

  const img = new Image()
  img.src = src

  return new Promise((resolve, reject) => {
    img.onload = function () {
      const imgWidth = img.width
      const imgHeight = img.height
      const imgRatio = imgWidth / imgHeight
      const dpr = window.devicePixelRatio || 1

      let sourceX, sourceY, sourceWidth, sourceHeight

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
          sourceHeight = divHeight / scale
          sourceX = 0
          sourceY = (imgHeight - sourceHeight) / 2
        } else {
          const scale = divHeight / imgHeight
          sourceWidth = divWidth / scale
          sourceHeight = imgHeight
          sourceX = (imgWidth - sourceWidth) / 2
          sourceY = 0
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = divWidth
      canvas.height = divHeight
      canvas.style.width = divWidth + 'px'
      canvas.style.height = divHeight + 'px'
      const ctx = canvas.getContext('2d')
      ctx.scale(dpr, dpr)
      ctx.drawImage(
        img,
        sourceX / dpr,
        sourceY / dpr,
        sourceWidth / dpr,
        sourceHeight / dpr
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
