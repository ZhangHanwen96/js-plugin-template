import React, { useEffect, useState } from 'react'
import './index.scss'
import Background from '../components/background'

interface SelectNode {
  id: string
  name: string
  thumb: Uint8Array
  width: number
  height: number
  thumbSrc: string
}

const App: React.FC = () => {
  return (
    <div className="container flex h-[540px] w-[560px] items-center justify-center">
      <Background />
    </div>
  )
}

export default App
