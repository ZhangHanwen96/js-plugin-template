import { Mode } from '@/interface'
import { AIProxyParams } from '@/service/aiProxy'
import { ExtendPosition } from '@/service/extendImage'
import { createContext } from 'react'

type ExtendParams = {
  mode: 'extend'
  params: {
    file: File
    width: number
    height: number
    position: ExtendPosition
  }
}

type PartialRedrawParams = {
  mode: 'partialRedraw'
  params: AIProxyParams
}

export interface Context {
  requestParams?: ExtendParams | PartialRedrawParams
}

export const ctx = createContext<Context>({} as Context)
