import { getFreshAccessToken } from '@/utils/getAccessToken'

import { ExtendImage, UpScaleImage } from 'jsd-tezign-image'

export const extendImage = async (image: any) => {
  const extendStep = new ExtendImage({} as any, 1000, 1200, 'repeat')
  const accessToken = await getFreshAccessToken()
  return [] as string[]
}
