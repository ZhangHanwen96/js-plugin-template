import { fetchAccessToken } from '@/service/getAccessToken'
import { useMemoizedFn, useRequest } from 'ahooks'
import React, { FC, createContext, useRef, useState } from 'react'

interface AuthContext {
  getAccessToken: () => Promise<string>
}

const authCtx = createContext<AuthContext>(null as AuthContext)

type Resolve = (value: string) => void

const isExpired = (timestamp: number) => {
  return timestamp >= Date.now()
}

export const AuthProdiver: FC<{ children: any }> = ({ children }) => {
  const resolveQRef = useRef<Resolve[]>([])
  const [accessToken, setAccessToken] = useState<string>()
  const accessTokenRef = useRef<string>()
  const expiredAtRef = useRef<number>()

  const { run } = useRequest(fetchAccessToken, {
    manual: true,
    onSuccess(data) {
      expiredAtRef.current = data.expireAt
      accessTokenRef.current = accessToken
      setAccessToken(accessToken)

      resolveQRef.current.forEach((resolve) => {
        resolve(accessToken)
      })
      resolveQRef.current = []
    }
  })

  const getAccessToken = useMemoizedFn(async () => {
    // if not expired
    if (
      expiredAtRef.current &&
      !isExpired(expiredAtRef.current) &&
      accessTokenRef.current
    ) {
      return accessTokenRef.current
    }
    // first getAccessToken request
    if (resolveQRef.current.length === 0) {
      run()
    }
    const p = new Promise<string>((resolve) => {
      resolveQRef.current.push(resolve)
    })

    return p
  })

  return (
    <authCtx.Provider
      value={{
        getAccessToken
      }}
    >
      {children}
    </authCtx.Provider>
  )
}
