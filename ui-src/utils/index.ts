import { eventPubsub } from '@/store'
import { uuid } from './uuid'
import { getMimeTypeFromDataUrl } from './mime'

export const base64ToDataUrl = (base64: string, ext = 'png') => {
  return `data:image/${ext};base64,${base64}`
}

export const dataUrlToBase64 = (dataUrl: string) => {
  return dataUrl.split(',')[1]
}

export const dataUrlToFile = async (dataUrl: string, name: string) => {
  const mimeType = getMimeTypeFromDataUrl(dataUrl)
  const ext = mimeType.split('/')[1]
  const blob = await (await fetch(dataUrl)).blob()
  const file = new File([blob], `${name}.${ext}`, {
    type: mimeType
  })
  return file
}

// export function dataURLtoBlob(dataurl: string) {
//   const parts = dataurl.split(',')
//   const mime = parts[0].match(/:(.*?);/)[1]
//   const bstr = atob(parts[1])
//   let n = bstr.length
//   const u8arr = new Uint8Array(n)
//   while (n--) {
//     u8arr[n] = bstr.charCodeAt(n)
//   }
//   return new Blob([u8arr], { type: mime })
// }

export const fileToUrl = async (file: File) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const url = reader.result
      resolve(url as string)
    }
    reader.onerror = reject
  })
}

export const delay = async (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms))

export const postMessage = async <T>(pluginMessage: any, timeout = 6000) => {
  const requestId = uuid()
  parent.postMessage(
    {
      pluginMessage: {
        ...pluginMessage,
        requestId
      }
    },
    '*'
  )
  const responsePromise = new Promise<T>((resolve, reject) => {
    eventPubsub.once(requestId, (data) => {
      resolve(data)
    })
    setTimeout(() => {
      reject(new Error('timeout'))
    }, timeout)
  })

  return responsePromise
}

export const downloadFile = async (file: File) => {
  const download = document.createElement('a')
  const url = await fileToUrl(file)
  download.href = url
  download.download = file.name
  document.body.appendChild(download) // Add it to the body
  download.click()
  document.body.removeChild(download) // Remove it afterwards
}
