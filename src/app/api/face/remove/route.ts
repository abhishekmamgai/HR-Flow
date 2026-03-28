import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCompanyContext } from '@/lib/auth/company-context'

export async function POST(request: Request) {
  try {
    const { employeeId } = await request.json()

    if (!employeeId) {
      return NextResponse.json({ error: 'Missing employeeId' }, { status: 400 })
    }

    const { companyId } = await getCompanyContext()
    const supabase = await createClient()

    const { error } = await supabase
      .from('employees')
      .update({
        face_embedding: null,
        face_registered_at: null,
        face_consent_given: false
      })
      .eq('id', employeeId)
      .eq('company_id', companyId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('❌ Remove Face API Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
