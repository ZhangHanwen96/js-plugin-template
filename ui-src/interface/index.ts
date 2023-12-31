import { ExtendPosition } from '@/service/extendImage'

export interface Rect {
  x: number
  y: number
  height: number
  width: number
}

export type Mode = 'extend' | 'partialRedraw'

export interface HistoryRecord {
  timestamp: number
  mode: Mode
  src: string
  dir?: ExtendPosition
  id: string
}
