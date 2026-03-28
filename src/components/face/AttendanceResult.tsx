'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useRole } from '@/lib/auth/role-context'

interface AttendanceResultProps {
  result: {
    action: 'CHECK_IN' | 'CHECK_OUT' | 'ALREADY_DONE' | 'NO_MATCH'
    employee?: {
      id: string
      name: string
      employee_code: string
      department: string
    }
    attendance?: {
      check_in: string | null
      check_out: string | null
      total_hours: number | null
      total_hours_formatted: string | null
      status: 'present' | 'late' | 'half_day'
    }
    confidence?: number
  }
  onDone: () => void
}

export function AttendanceResult({ result, onDone }: AttendanceResultProps) {
  const [countdown, setCountdown] = useState(4)
  const router = useRouter()

  const { action, employee, attendance, confidence } = result

  const { isAdmin } = useRole()

  useEffect(() => {
    if (action === 'NO_MATCH') return

    if (countdown === 0) {
      onDone()
      router.push(isAdmin ? '/dashboard' : '/employee/dashboard')
      return
    }

    const timer = setInterval(() => {
      setCountdown(prev => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [action, countdown, onDone, router, isAdmin])

  if (action === 'NO_MATCH') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-50/95 backdrop-blur-sm p-6 text-center">
        <div className="max-w-sm w-full animate-in zoom-in duration-300">
          <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center text-5xl mb-6">
            ❌
          </div>
          <h1 className="text-3xl font-bold text-red-800 mb-2">Face Not Recognized</h1>
          <p className="text-red-600 mb-8">Please try again or contact HR for registration.</p>
          <button 
            onClick={onDone}
            className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const themes = {
    CHECK_IN: {
      bg: 'bg-green-500',
      text: 'text-green-600',
      light: 'bg-green-50',
      icon: '✅',
      title: 'Checked In Successfully'
    },
    CHECK_OUT: {
      bg: 'bg-blue-500',
      text: 'text-blue-600',
      light: 'bg-blue-50',
      icon: '🚪',
      title: 'Checked Out Successfully'
    },
    ALREADY_DONE: {
      bg: 'bg-slate-400',
      text: 'text-slate-600',
      light: 'bg-slate-50',
      icon: 'ℹ️',
      title: 'Already Done Today!'
    }
  }

  const theme = themes[action as keyof typeof themes] || themes.ALREADY_DONE

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white animate-in fade-in duration-500">
      <div className="w-full max-w-lg h-full sm:h-auto flex flex-col items-center">
        {/* Top Gradient Bar */}
        <div className={`w-full h-32 ${theme.bg} flex items-center justify-center relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-transparent" />
          <div className="text-7xl animate-in zoom-in-50 duration-500 scale-110 drop-shadow-xl">{theme.icon}</div>
        </div>

        <div className="w-full p-8 text-center -mt-6 bg-white rounded-t-3xl relative z-10 flex-1">
          <h2 className="text-4xl font-black text-slate-800 tracking-tight" style={{ fontFamily: 'var(--font-fraunces)' }}>
            {employee?.name}
          </h2>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-500">
            {employee?.employee_code}
          </div>

          <div className={`mt-10 rounded-[2rem] border-2 border-slate-50 p-8 shadow-xl shadow-slate-100/50 ${theme.light}`}>
            <p className={`text-sm font-black uppercase tracking-widest ${theme.text} mb-4`}>
              {theme.title}
            </p>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center text-slate-600">
                <span className="text-sm font-medium">📍 Time</span>
                <span className="text-xl font-bold text-slate-800">
                  {action === 'CHECK_IN' ? attendance?.check_in : (attendance?.check_out || attendance?.check_in)}
                </span>
              </div>
              
              <div className="flex justify-between items-center text-slate-600">
                <span className="text-sm font-medium">📅 Date</span>
                <span className="text-sm font-bold text-slate-800">
                  {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>

              {action === 'CHECK_OUT' && (
                <div className="pt-6 border-t border-slate-200/50">
                  <div className="flex justify-between items-center bg-white/50 p-4 rounded-2xl">
                    <div className="text-left">
                      <p className="text-[10px] uppercase font-black text-slate-400">Total Hours</p>
                      <p className="text-2xl font-black text-blue-600">{attendance?.total_hours_formatted}</p>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-xs font-black text-white ${
                      (attendance?.total_hours || 0) >= 8 ? 'bg-green-500' : 'bg-orange-500'
                    }`}>
                      {(attendance?.total_hours || 0) >= 8 ? 'Full Day ✅' : 'Half Day ⚠️'}
                    </span>
                  </div>
                </div>
              )}

              {action === 'CHECK_IN' && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">⏱ Status</span>
                  <span className={`text-sm font-bold ${attendance?.status === 'late' ? 'text-orange-500' : 'text-green-500'}`}>
                    {attendance?.status === 'late' ? 'Late Arrival' : 'On Time'}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">🎯 Confidence</span>
                <span className="text-sm font-bold text-slate-800">{confidence}%</span>
              </div>
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="mt-12 w-full max-w-xs mx-auto">
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full ${theme.bg} transition-all duration-1000 ease-linear`}
                style={{ width: `${(countdown / 4) * 100}%` }}
              />
            </div>
            <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
              Redirecting in {countdown}...
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
