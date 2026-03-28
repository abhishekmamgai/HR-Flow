import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCompanyContext } from '@/lib/auth/company-context'

function euclideanDistance(a: number[], b: number[]) {
  return Math.sqrt(
    a.reduce((sum, v, i) => sum + Math.pow(v - b[i], 2), 0)
  )
}

export async function POST(request: Request) {
  try {
    const { descriptor } = await request.json()

    if (!descriptor || !Array.isArray(descriptor)) {
      return NextResponse.json({ error: 'Missing descriptor' }, { status: 400 })
    }

    const { companyId } = await getCompanyContext()
    const supabase = await createClient()

    // 1. Fetch ALL active employees with face_embedding for this company
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, employee_code, department_id, face_embedding')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .not('face_embedding', 'is', null)

    if (empError) {
      console.error('❌ Fetch Employees Error:', empError)
      return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 })
    }

    // 2. Find employee with MINIMUM distance
    const threshold = 0.5
    let bestMatch = null
    let bestDistance = Infinity

    for (const employee of employees) {
      const embedding = employee.face_embedding as number[]
      if (!embedding) continue
      
      const distance = euclideanDistance(descriptor, embedding)
      if (distance < threshold && distance < bestDistance) {
        bestMatch = employee
        bestDistance = distance
      }
    }

    if (!bestMatch) {
      return NextResponse.json({ action: 'NO_MATCH' })
    }

    // 3. Match found — check today's attendance
    const today = new Date().toISOString().slice(0, 10)
    const { data: record, error: findError } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', bestMatch.id)
      .eq('date', today)
      .eq('company_id', companyId)
      .maybeSingle()

    if (findError) {
      console.error('❌ Find Attendance Error:', findError)
      return NextResponse.json({ error: 'Failed to check attendance' }, { status: 500 })
    }

    let action: 'CHECK_IN' | 'CHECK_OUT' | 'ALREADY_DONE' = 'CHECK_IN'
    let attendanceData = record

    if (!record) {
      // 4. No record -> CHECK_IN
      const now = new Date()
      // Late detection: 09:15 AM
      const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 15)
      
      const { data: inserted, error: insError } = await supabase
        .from('attendance')
        .insert({
          employee_id: bestMatch.id,
          company_id: companyId,
          date: today,
          check_in: now.toISOString(),
          status: isLate ? 'LATE' : 'PRESENT',
          is_face_verified: true,
          face_match_score: 1 - bestDistance
        })
        .select('*')
        .single()

      if (insError) throw insError
      action = 'CHECK_IN'
      attendanceData = inserted
    } else if (!record.check_out) {
      // 5. Record exists, check_out NULL -> CHECK_OUT
      const now = new Date()
      const checkIn = new Date(record.check_in)
      const totalHours = (now.getTime() - checkIn.getTime()) / (1000 * 60 * 60)

      const { data: updated, error: updError } = await supabase
        .from('attendance')
        .update({
          check_out: now.toISOString(),
          total_hours: totalHours
        })
        .eq('id', record.id)
        .select('*')
        .single()

      if (updError) throw updError
      action = 'CHECK_OUT'
      attendanceData = updated
    } else {
      // 6. Record exists, check_out NOT NULL -> ALREADY_DONE
      action = 'ALREADY_DONE'
    }

    // Format for return
    const formatTime = (iso: string | null) => {
      if (!iso) return null
      return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }

    const formatHours = (h: number | null) => {
      if (h === null) return null
      const hours = Math.floor(h)
      const minutes = Math.round((h - hours) * 60)
      return `${hours}h ${minutes}min`
    }

    return NextResponse.json({
      action,
      employee: {
        id: bestMatch.id,
        name: `${bestMatch.first_name} ${bestMatch.last_name}`,
        employee_code: bestMatch.employee_code,
        department: 'Engineering' // Hardcoded for now, or fetch if needed
      },
      attendance: {
        check_in: formatTime(attendanceData?.check_in),
        check_out: formatTime(attendanceData?.check_out),
        total_hours: attendanceData?.total_hours,
        total_hours_formatted: formatHours(attendanceData?.total_hours),
        status: attendanceData?.status?.toLowerCase() // 'present' | 'late'
      },
      confidence: Math.round((1 - bestDistance) * 100)
    })

  } catch (err) {
    console.error('❌ Face Check-in API Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
