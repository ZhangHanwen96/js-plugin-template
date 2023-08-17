import { createRoot } from 'react-dom/client'
import App from './App'
import React from 'react'
import ConfigProvider from '@tezign/tezign-ui/es/config-provider'
import { usePluginStore } from './store'
import zhCN from '@tezign/tezign-ui/lib/locale/zh_CN'
import { AuthProdiver } from './components/auth-provider'

const root = createRoot(document.getElementById('root')!)

const Root = () => {
  const __remount_updater = usePluginStore.use.__remount_updater()

  return (
    <ConfigProvider locale={zhCN}>
      {/* <AuthProdiver> */}
      <App key={__remount_updater} />
      {/* </AuthProdiver> */}
    </ConfigProvider>
  )
}

root.render(<Root />)
