import { config } from '@/config'

export const fetchAccessToken = async () => {
  const response = await fetch(
    `${config.js_api_origin}/open-api/oauth/v1/enterprise/accessToken`,
    {
      method: 'post',
      body: JSON.stringify({
        appId: config.appId,
        appSecret: config.appSecret
      })
    }
  )
  const res = await response.json()
  /**
   * seconds
   */
  const expireIn = res.data.expireIn
  const expireAt = new Date().getTime() + expireIn * 1000
  return {
    accessToken: res.data.accessToken,
    expireAt
  } as {
    accessToken: string
    /**
     * seconds
     */
    expireAt: number
  }
}
