import { createRoot } from 'react-dom/client'
import App from './App'
import React from 'react'
import { usePluginStore } from './store'
// import zhCN from '@tezign/tezign-ui/lib/locale/zh_CN'

const root = createRoot(document.getElementById('root')!)

const Root = () => {
  const __remount_updater = usePluginStore.use.__remount_updater()

  return <App key={__remount_updater} />
}

root.render(<Root />)
