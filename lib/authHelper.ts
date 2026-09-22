import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export interface SessionUser {
  id: string
  _id: string // Backwards compatibility for existing components
  email: string
  name: string
  image?: string
  upi_id?: string
  upi_name?: string
  upi_qr_code?: string
  business_name?: string
  business_phone?: string
  business_address?: string
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return null
  }

  const email = session.user.email.toLowerCase()
  const name = session.user.name || 'User'
  const image = session.user.image || ''

  try {
    // 1. Query user from Supabase
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (existingUser && !fetchError) {
      let meta: Record<string, any> = {}
      if (existingUser.stripe_customer_id && typeof existingUser.stripe_customer_id === 'string' && existingUser.stripe_customer_id.startsWith('{')) {
        try {
          meta = JSON.parse(existingUser.stripe_customer_id)
        } catch (e) {}
      }

      return {
        id: existingUser.id,
        _id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        image: existingUser.image,
        upi_id: existingUser.upi_id || meta.upi_id || process.env.NEXT_PUBLIC_DEFAULT_UPI_ID || 'hemantmeena2005@oksbi',
        upi_name: existingUser.upi_name || meta.upi_name || existingUser.name,
        upi_qr_code: existingUser.upi_qr_code || meta.upi_qr_code || '',
        business_name: existingUser.business_name || meta.business_name || '',
        business_phone: existingUser.business_phone || meta.business_phone || '',
        business_address: existingUser.business_address || meta.business_address || '',
      }
    }

    // 2. If user doesn't exist, create one
    const userId = (session.user as any).id || `user_${Date.now()}`
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert([
        {
          id: userId,
          email,
          name,
          image,
        },
      ])
      .select()
      .single()

    if (newUser && !insertError) {
      return {
        id: newUser.id,
        _id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        image: newUser.image,
      }
    }

    // Fallback if Supabase table is not yet migrated or local offline preview
    return {
      id: userId,
      _id: userId,
      email,
      name,
      image,
    }
  } catch (error) {
    console.error('Error in getSessionUser (Supabase):', error)
    return {
      id: 'demo_user_id',
      _id: 'demo_user_id',
      email,
      name,
      image,
    }
  }
}
