import { config } from '@/config'

export const getToken = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const url = `${config.js_api_origin}/open-api/oauth/v1/enterprise/accessToken`

    xhr.open('POST', url, true)
    xhr.withCredentials = true // to handle CORS with credentials
    xhr.setRequestHeader('Content-Type', 'application/json')

    // The 'load' event is triggered when the request has successfully completed.
    xhr.onload = function () {
      if (this.status >= 200 && this.status < 400) {
        // The request was successful, and the response is in this.responseText
        resolve(JSON.parse(this.responseText).data)
      } else {
        // The server returned an error status.
        reject(new Error('Server returned an error.'))
      }
    }

    // The 'error' event is triggered if the request failed to reach the server.
    xhr.onerror = function () {
      reject(new Error('Network error occurred.'))
    }

    xhr.send(
      JSON.stringify({
        appId: config.appId,
        appSecret: config.appSecret
      })
    )
  })
}

// export const getToken = (): Promise<any> => {
//   return new Promise((resolve, reject) => {
//     console.log('[getToken]')
//     $.ajax({
//       url: `${config.js_api_origin}/open-api/oauth/v1/enterprise/accessToken`,
//       type: 'post',
//       data: JSON.stringify({
//         appId: config.appId,
//         appSecret: config.appSecret
//       }),
//       xhrFields: { withCredentials: true },
//       crossDomain: true,
//       contentType: 'application/json',
//       success: (res) => resolve(res.data),
//       error: (err) => reject(err)
//     })
//   })
// }

export const fetchAccessToken = async () => {
  const data = await getToken()
  /**
   * seconds
   */
  const expireIn = data.expireIn
  const expireAt = new Date().getTime() + expireIn * 1000
  return {
    accessToken: data.accessToken,
    expireAt
  } as {
    accessToken: string
    /**
     * seconds
     */
    expireAt: number
  }
}
