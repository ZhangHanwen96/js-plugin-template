import { createRoot } from 'react-dom/client'
import App from './App'
import React from 'react'
import ConfigProvider from '@tezign/tezign-ui/es/config-provider'
import { usePluginStore } from './store'
import zhCN from '@tezign/tezign-ui/lib/locale/zh_CN'

const root = createRoot(document.getElementById('root')!)

const Root = () => {
  const __remount_updater = usePluginStore.use.__remount_updater()

  return (
    <ConfigProvider locale={zhCN}>
      <App key={__remount_updater} />
    </ConfigProvider>
  )
}

root.render(<Root />)
