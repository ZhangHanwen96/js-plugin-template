import { SetStateAction } from 'react'
import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

import { createSelectors } from './createSelectors'
import Pubsub from '../utils/pubsub'

type State = {
  scale: number
}

type Actions = {
  calculateScale: ({ width, height }: { width: number; height: number }) => void
}

// const eventPubsub = new Pubsub()

/**
 * Knowledge Assistant Store
 */
const _pluginStore = create(
  devtools(
    subscribeWithSelector(
      immer<State & Actions>((set, get) => ({
        scale: 1,
        calculateScale({ width, height }) {
          // todo
          const posterRect = { width: 0, height: 0 }
          set((state) => {
            state.scale = 1
          })
          //   parent.postMessage({
          //     pluginMessage: {
          //       type: 'getPosterRect',
          //       requestId: 'getPosterRect'
          //     }
          //   })
          //   const responsePromise = new Promise((resolve, reject) => {
          //     eventPubsub.once('getPosterRect', (data) => {
          //         if(data.requestId === '') {
          //             resolve(data)
          //         }
          //     })
          //   })
          // //   const timeoutPromise = new Promise((resolve, reject) => {
          // //     setTimeout(() => {
          // //       reject('timeout')
          // //     }, 4000)
          // //   })
          //   const response = await responsePromise
          //    const { width: posterWidth, height: posterHeight } = response
        }
      }))
    ),
    {
      name: 'tezign-jishi-store',
      store: 'tezign-jishi-store'
    }
  )
)

const usePluginStore = createSelectors(_pluginStore)

export { usePluginStore }
