'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface FaceSectionProps {
  employee: {
    id: string
    first_name: string
    last_name: string
    face_embedding: number[] | null
    face_registered_at: string | null
  }
}

export function FaceSection({ employee }: FaceSectionProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const isRegistered = !!employee.face_embedding

  const handleRemove = async () => {
    if (!confirm('Are you sure you want to remove face data for this employee?')) return
    setLoading(true)
    try {
      const res = await fetch('/api/face/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: employee.id })
      })
      if (res.ok) {
        router.refresh()
      }
    } catch (err) {
      console.error(err)
      alert('Failed to remove face data')
    } finally {
      setLoading(false)
    }
  }

  const navigateToRegister = () => {
    router.push(`/face-id?mode=register&employeeId=${employee.id}&name=${employee.first_name} ${employee.last_name}`)
  }

  return (
    <div className="mt-8">
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Face Recognition</h3>
      
      {!isRegistered ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-800 font-bold">Face Not Registered</span>
            <span className="px-3 py-1 bg-slate-200 text-slate-600 text-[10px] font-bold rounded-full uppercase">Not Registered</span>
          </div>
          <button
            onClick={navigateToRegister}
            className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold shadow-lg shadow-purple-100 hover:bg-purple-700 transition-all flex items-center justify-center gap-2"
          >
            📸 Register Face
          </button>
          <p className="mt-3 text-center text-xs text-slate-400">
            Employee must be present to register
          </p>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-100 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-green-800 font-bold">Face Active ✓</span>
            <span className="px-3 py-1 bg-green-500 text-white text-[10px] font-bold rounded-full uppercase">Registered</span>
          </div>
          <p className="text-xs text-green-700/70 mb-6">
            Registered on: {employee.face_registered_at ? new Date(employee.face_registered_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={navigateToRegister}
              disabled={loading}
              className="flex-1 py-3 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300 transition-all disabled:opacity-50"
            >
              Re-register
            </button>
            <button
              onClick={handleRemove}
              disabled={loading}
              className="px-4 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-all border border-red-100 disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
