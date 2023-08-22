export const getMimeTypeFromFileName = (name: string) => {
  const lastName = name.substring(name.lastIndexOf('.') + 1)
  switch (lastName) {
    case 'gif':
      return 'gif'
    case 'jpe':
    case 'jpg':
    case 'jpeg':
      return 'jpeg'
    case 'tiff':
      return 'tiff'
    case 'png':
      return 'png'
    case 'webp':
      return 'webp'
    case 'bmp':
      return 'bmp'
    case 'zip':
      return 'zip'
    case 'json':
      return 'json'
    case 'lottie':
      return 'lottie'
    default:
      throw new Error('无法识别的媒体类型')
  }
}

export const getMimeTypeFromDataUrl = (dataUrl: string) => {
  return dataUrl.substring(dataUrl.indexOf(':') + 1, dataUrl.indexOf(';'))
}
