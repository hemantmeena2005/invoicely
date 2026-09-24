import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/authHelper'
import { supabaseAdmin } from '@/lib/supabase'

function parseMetadata(str?: string | null): Record<string, any> {
  if (!str || typeof str !== 'string') return {}
  if (str.startsWith('{')) {
    try {
      return JSON.parse(str)
    } catch (e) {}
  }
  return {}
}

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: dbUser, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', user.email)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile from Supabase:', error)
    }

    const meta = parseMetadata(dbUser?.stripe_customer_id)

    return NextResponse.json({
      user: {
        id: dbUser?.id || user.id,
        email: user.email,
        name: dbUser?.name || user.name,
        image: dbUser?.image || user.image,
        upi_id: dbUser?.upi_id || meta.upi_id || process.env.NEXT_PUBLIC_DEFAULT_UPI_ID || 'demo@upi',
        upi_name: dbUser?.upi_name || meta.upi_name || dbUser?.name || user.name,
        upi_qr_code: dbUser?.upi_qr_code || meta.upi_qr_code || '',
        business_name: dbUser?.business_name || meta.business_name || '',
        business_phone: dbUser?.business_phone || meta.business_phone || '',
        business_address: dbUser?.business_address || meta.business_address || '',
      }
    })
  } catch (error) {
    console.error('Profile GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      image,
      upi_id,
      upi_name,
      upi_qr_code,
      business_name,
      business_phone,
      business_address,
    } = body

    const cleanUpiId = (upi_id || '').trim()
    const cleanUpiName = (upi_name || '').trim()
    const cleanBusinessName = (business_name || '').trim()
    const cleanBusinessPhone = (business_phone || '').trim()
    const cleanBusinessAddress = (business_address || '').trim()

    const updatePayload: Record<string, any> = {}
    if (name !== undefined) updatePayload.name = name.trim()
    if (image !== undefined) updatePayload.image = image
    if (upi_id !== undefined) updatePayload.upi_id = cleanUpiId
    if (upi_name !== undefined) updatePayload.upi_name = cleanUpiName
    if (upi_qr_code !== undefined) updatePayload.upi_qr_code = upi_qr_code
    if (business_name !== undefined) updatePayload.business_name = cleanBusinessName
    if (business_phone !== undefined) updatePayload.business_phone = cleanBusinessPhone
    if (business_address !== undefined) updatePayload.business_address = cleanBusinessAddress

    // 1. Try updating columns directly in Supabase
    let { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update(updatePayload)
      .eq('email', user.email)
      .select()
      .single()

    // 2. If columns are not migrated yet in Supabase (PGRST204), store in metadata fallback
    if (error) {
      console.warn('Direct column update error in Supabase, using metadata storage fallback:', error.message)

      const metaJson = JSON.stringify({
        upi_id: cleanUpiId,
        upi_name: cleanUpiName,
        upi_qr_code: upi_qr_code || '',
        business_name: cleanBusinessName,
        business_phone: cleanBusinessPhone,
        business_address: cleanBusinessAddress,
      })

      const fallbackPayload: Record<string, any> = {
        stripe_customer_id: metaJson,
      }
      if (name) fallbackPayload.name = name.trim()
      if (image !== undefined) fallbackPayload.image = image

      const { data: fallbackUser, error: fallbackError } = await supabaseAdmin
        .from('users')
        .update(fallbackPayload)
        .eq('email', user.email)
        .select()
        .single()

      if (fallbackUser) {
        updatedUser = fallbackUser
      } else if (fallbackError) {
        console.error('Fallback user update error:', fallbackError)
      }
    }

    const meta = parseMetadata(updatedUser?.stripe_customer_id)

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser?.id || user.id,
        email: user.email,
        name: updatedUser?.name || name || user.name,
        image: updatedUser?.image || image || user.image,
        upi_id: updatedUser?.upi_id || meta.upi_id || cleanUpiId || process.env.NEXT_PUBLIC_DEFAULT_UPI_ID || 'demo@upi',
        upi_name: updatedUser?.upi_name || meta.upi_name || cleanUpiName || user.name,
        upi_qr_code: updatedUser?.upi_qr_code || meta.upi_qr_code || upi_qr_code || '',
        business_name: updatedUser?.business_name || meta.business_name || cleanBusinessName || '',
        business_phone: updatedUser?.business_phone || meta.business_phone || cleanBusinessPhone || '',
        business_address: updatedUser?.business_address || meta.business_address || cleanBusinessAddress || '',
      }
    })
  } catch (error) {
    console.error('Profile PUT error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
