const getConfig = (
  plugin_env: 'testing' | 'production' | 'loreal' | 'stage' = 'testing'
) => {
  switch (plugin_env) {
    case 'production':
    case 'loreal':
    case 'stage':
    case 'testing':
    default:
      return {
        appId: '64cc6aeaee874629d062eafb',
        appSecret: 'LsNQhekRa26ExR9X9bdu49wS7OMLIqT5asz99zajO2FfjJ0kZc',
        js_api_origin: 'test-api.js.design'
      }
  }
}

const config = getConfig(import.meta.env.VITE_PLUGIN_ENV)

export { config }
