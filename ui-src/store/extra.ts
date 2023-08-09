import { SetStateAction } from 'react'
import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

import { createSelectors } from './createSelectors'

type State = {
  tab: 'extend' | 'partialRedraw'
}

type Actions = {
  setTab: (tab: SetStateAction<'extend' | 'partialRedraw'>) => void
}

const _extraStore = create(
  devtools(
    subscribeWithSelector(
      immer<State & Actions>((set, get) => ({
        tab: 'extend',
        setTab: (tab) => {
          set((state) => {
            state.tab = typeof tab === 'function' ? tab(state.tab) : tab
          })
        }
      }))
    ),
    {
      name: 'tezign-extra-store',
      store: 'tezign-extra-store'
    }
  )
)
const useExtraStore = createSelectors(_extraStore)

export { useExtraStore }
