import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCompanyContext } from '@/lib/auth/company-context'

export async function POST(request: Request) {
  try {
    const { employeeId, descriptor } = await request.json()

    if (!employeeId || !descriptor || !Array.isArray(descriptor)) {
      return NextResponse.json({ error: 'Missing employeeId or descriptor' }, { status: 400 })
    }

    const { companyId } = await getCompanyContext()
    const supabase = await createClient()

    // 1. Verify employee belongs to this company
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id')
      .eq('id', employeeId)
      .eq('company_id', companyId)
      .single()

    if (empError || !employee) {
      return NextResponse.json({ error: 'Employee not found in your company' }, { status: 404 })
    }

    // 2. Update employee with face embedding
    const { error: updateError } = await supabase
      .from('employees')
      .update({
        face_embedding: descriptor,
        face_registered_at: new Date().toISOString(),
        face_consent_given: true
      })
      .eq('id', employeeId)

    if (updateError) {
      console.error('❌ DB Update Error:', updateError)
      return NextResponse.json({ error: 'Failed to save face data' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('❌ Face Registration API Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
