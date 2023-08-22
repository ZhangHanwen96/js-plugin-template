import { SetStateAction } from 'react'
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

import { createSelectors } from './createSelectors'
import { Rect } from '@/interface'

type State = {
  tab: 'extend' | 'partialRedraw'
  boxSelectDivStyle?: Rect
  pageChangeAlert: {
    show: boolean
    shouldChange: boolean
  }
  storage: Record<string, any>
}

type Actions = {
  setTab: (tab: SetStateAction<'extend' | 'partialRedraw'>) => void
  setBoxSelectDivStyle: (s: SetStateAction<Rect> | undefined) => void
}

const _extraStore = create(
  subscribeWithSelector(
    immer<State & Actions>((set) => ({
      tab: 'extend',
      pageChangeAlert: {
        shouldChange: false,
        show: true
      },
      storage: {},
      setTab: (tab) => {
        set((state) => {
          state.tab = typeof tab === 'function' ? tab(state.tab) : tab
        })
      },
      boxSelectDivStyle: undefined,
      setBoxSelectDivStyle(style) {
        set((state) => {
          state.boxSelectDivStyle =
            typeof style === 'function' ? style(state.boxSelectDivStyle) : style
        })
      }
    }))
  )
)
const useExtraStore = createSelectors(_extraStore)

export { useExtraStore }
