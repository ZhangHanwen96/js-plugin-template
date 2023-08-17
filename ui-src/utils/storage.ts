import { useExtraStore } from '@/store/extra'

export const storage = {
  async get(key?: string) {
    const storage = useExtraStore.getState().storage
    return key ? storage[key] : storage
  },
  async set(key: string, value: any) {
    const storage = useExtraStore.getState().storage
    useExtraStore.setState({
      storage: {
        ...storage,
        [key]: value
      }
    })
    parent.postMessage({
      pluginMessage: {
        type: 'storage',
        payload: {
          type: 'set',
          parmas: [key, value]
        }
      }
    })
  },
  async delete(key: string) {
    parent.postMessage({
      pluginMessage: {
        type: 'storage',
        payload: {
          type: 'delete',
          parmas: [key]
        }
      }
    })
  }
}
