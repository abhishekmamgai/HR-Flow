'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const FaceIdClient = dynamic(() => import('./face-id-client').then(mod => mod.FaceIdContent), {
  ssr: false,
  loading: () => <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading Face ID System...</div>
})

export default function FaceIdPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50">Loading...</div>}>
      <FaceIdClient />
    </Suspense>
  )
}
