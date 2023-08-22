import { config } from '@/config'
import { getFreshAccessToken } from '@/utils/getAccessToken'

export type AIProxyParams = {
  files?: File[]
  params: Record<string, any>
  api: '/api/diffusion/annotate' | '/api/diffusion/generate'
}

export const aiProxy = async ({
  files,
  api,
  params: extraParams
}: AIProxyParams): Promise<string[]> => {
  const token = await getFreshAccessToken()
  return new Promise((resolve, reject) => {
    console.log('aiProxy start')
    const xhr = new XMLHttpRequest()
    xhr.open(
      'POST',
      `${config.js_api_origin}/open-api/v1/ai/proxy?accessToken=${token}`
    )
    xhr.setRequestHeader('Access-Control-Allow-Origin', '*')
    xhr.withCredentials = true
    const params = JSON.stringify(extraParams)

    const fd = new FormData()
    files.forEach((item) => {
      fd.append('files', item)
    })
    fd.append('params', params)
    fd.append('api', api)
    xhr.send(fd)
    xhr.onreadystatechange = function () {
      if (xhr.status == 200) {
        const res = JSON.parse(xhr.responseText)
        resolve(res.images)
      } else {
        // TODO: timeout ?
        reject()
      }
      xhr.onreadystatechange = undefined
      xhr.abort()
    }
  })
}
