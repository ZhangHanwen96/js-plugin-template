import { fetchAccessToken } from '@/service/getAccessToken'

const resolveQ: Resolve[] = []
let accessToken: string
let expiredAt: number

type Resolve = (value: string) => void

const isExpired = (timestamp: number) => {
  return timestamp >= Date.now()
}

const _getAccessToken = async () => {
  try {
    const res = await fetchAccessToken()
    accessToken = res.accessToken
    expiredAt = res.expireAt
    const q = resolveQ.splice(0)
    q.forEach((resolve) => {
      resolve(accessToken)
    })
  } catch (error) {
    console.error(error)
  }
}

export const getFreshAccessToken = () => {
  if (expiredAt && !isExpired(expiredAt) && accessToken) {
    return accessToken
  }
  if (resolveQ.length === 0) {
    _getAccessToken()
  }
  const p = new Promise<string>((resolve) => {
    resolveQ.push(resolve)
  })

  return p
}
