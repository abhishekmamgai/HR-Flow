'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface TodayStatusCardProps {
  status: {
    todayStatus: string | null
    todayCheckIn: string | null
    todayCheckOut: string | null
    todayTotalHours: number | null
  }
}

export function TodayStatusCard({ status }: TodayStatusCardProps) {
  const router = useRouter()
  
  const calculateDuration = useCallback(() => {
    if (!status.todayCheckIn) return ''
    const start = new Date(status.todayCheckIn)
    const diff = new Date().getTime() - start.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}min`
  }, [status.todayCheckIn])

  const [duration, setDuration] = useState<string>('')

  useEffect(() => {
    if (status.todayCheckIn && !status.todayCheckOut) {
      // Set initial duration AFTER mount to avoid hydration mismatch and sync setState warning
      const timeout = setTimeout(() => {
        setDuration(calculateDuration())
      }, 0)
      
      const interval = setInterval(() => {
        setDuration(calculateDuration())
      }, 60000)
      
      return () => {
        clearTimeout(timeout)
        clearInterval(interval)
      }
    }
  }, [status.todayCheckIn, status.todayCheckOut, calculateDuration])

  const formatTime = (iso: string | null) => {
    if (!iso) return ''
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  // CASE 1: Not checked in
  if (!status.todayCheckIn) {
    return (
      <div className="bg-white border-l-4 border-orange-500 rounded-2xl p-6 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-slate-400 font-bold text-sm uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
              Not Checked In Yet
            </div>
            <h2 className="text-2xl font-black text-slate-800 mt-2" style={{ fontFamily: 'var(--font-fraunces)' }}>
              Ready for work?
            </h2>
          </div>
          <button
            onClick={() => router.push('/face-id?mode=attend')}
            className="px-8 py-4 bg-purple-600 text-white rounded-2xl font-bold shadow-xl shadow-purple-100 hover:scale-[1.02] transition-all"
          >
            Mark Attendance with Face →
          </button>
        </div>
      </div>
    )
  }

  // CASE 2: Checked in, not checked out
  if (!status.todayCheckOut) {
    return (
      <div className="bg-white border-l-4 border-blue-500 rounded-2xl p-6 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-blue-500 font-bold text-sm uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              Currently In Office
            </div>
            <div className="flex items-baseline gap-4 mt-2">
              <p className="text-sm text-slate-500 font-medium">Check-in: <span className="text-slate-800 font-bold">{formatTime(status.todayCheckIn)}</span></p>
              <p className="text-sm text-slate-500 font-medium">Duration: <span className="text-blue-600 font-black">{duration || 'Calculating...'}</span></p>
            </div>
          </div>
          <button
            onClick={() => router.push('/face-id?mode=attend')}
            className="px-8 py-4 bg-purple-600 text-white rounded-2xl font-bold shadow-xl shadow-purple-100 hover:scale-[1.02] transition-all"
          >
            Check Out with Face →
          </button>
        </div>
      </div>
    )
  }

  // CASE 3: Day complete
  return (
    <div className="bg-white border-l-4 border-green-500 rounded-2xl p-6 shadow-sm mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-green-600 font-bold text-sm uppercase tracking-wider">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            Day Complete
          </div>
          <div className="flex items-center gap-6 mt-2">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-black">In</p>
              <p className="font-bold text-slate-800">{formatTime(status.todayCheckIn)}</p>
            </div>
            <div className="h-8 w-px bg-slate-100" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-black">Out</p>
              <p className="font-bold text-slate-800">{formatTime(status.todayCheckOut)}</p>
            </div>
            <div className="h-8 w-px bg-slate-100" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-black">Total</p>
              <p className="font-black text-slate-800 text-lg">
                {Math.floor(status.todayTotalHours || 0)}h {Math.round(((status.todayTotalHours || 0) % 1) * 60)}min
              </p>
            </div>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-full text-xs font-black uppercase ${
          status.todayStatus === 'PRESENT' ? 'bg-green-100 text-green-700' : 
          status.todayStatus === 'LATE' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'
        }`}>
          {status.todayStatus}
        </div>
      </div>
    </div>
  )
}
