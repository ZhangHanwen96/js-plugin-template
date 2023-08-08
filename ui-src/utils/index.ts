import { eventPubsub } from '@/store'
import { uuid } from './uuid'

export const delay = async (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms))

export const postMessage = async <T>(pluginMessage: any) => {
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
    }, 3000)
  })

  return responsePromise
}
