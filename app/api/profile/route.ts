import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/authHelper'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: dbUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile from Supabase:', error)
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: dbUser?.name || user.name,
        image: dbUser?.image || user.image,
        upi_id: dbUser?.upi_id || process.env.NEXT_PUBLIC_DEFAULT_UPI_ID || 'hemantmeena2005@oksbi',
        upi_name: dbUser?.upi_name || dbUser?.name || user.name,
        upi_qr_code: dbUser?.upi_qr_code || '',
        business_name: dbUser?.business_name || '',
        business_phone: dbUser?.business_phone || '',
        business_address: dbUser?.business_address || '',
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

    const updatePayload: Record<string, any> = {}
    if (name !== undefined) updatePayload.name = name.trim()
    if (image !== undefined) updatePayload.image = image
    if (upi_id !== undefined) updatePayload.upi_id = upi_id.trim()
    if (upi_name !== undefined) updatePayload.upi_name = upi_name.trim()
    if (upi_qr_code !== undefined) updatePayload.upi_qr_code = upi_qr_code
    if (business_name !== undefined) updatePayload.business_name = business_name.trim()
    if (business_phone !== undefined) updatePayload.business_phone = business_phone.trim()
    if (business_address !== undefined) updatePayload.business_address = business_address.trim()

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updatePayload)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating profile in Supabase:', error)
      // Fallback update if new columns aren't migrated in user's Supabase yet
      const fallbackPayload: Record<string, any> = {}
      if (name) fallbackPayload.name = name.trim()
      if (image !== undefined) fallbackPayload.image = image
      await supabase.from('users').update(fallbackPayload).eq('id', user.id)
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        name: updatedUser?.name || name || user.name,
        image: updatedUser?.image || image || user.image,
        upi_id: updatedUser?.upi_id || upi_id || process.env.NEXT_PUBLIC_DEFAULT_UPI_ID || 'hemantmeena2005@oksbi',
        upi_name: updatedUser?.upi_name || upi_name || user.name,
        upi_qr_code: updatedUser?.upi_qr_code || upi_qr_code || '',
        business_name: updatedUser?.business_name || business_name || '',
        business_phone: updatedUser?.business_phone || business_phone || '',
        business_address: updatedUser?.business_address || business_address || '',
      }
    })
  } catch (error) {
    console.error('Profile PUT error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
