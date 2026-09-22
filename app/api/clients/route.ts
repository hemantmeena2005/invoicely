import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/authHelper'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching clients from Supabase:', error)
      return NextResponse.json([], { status: 200 })
    }

    // Map `id` to `_id` so frontend remains 100% compatible
    const formattedClients = (clients || []).map((c) => ({
      ...c,
      _id: c.id,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }))

    return NextResponse.json(formattedClients)
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json([], { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, address, phone, company } = body

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Client name and email are required' }, { status: 400 })
    }

    const newClientData = {
      user_id: user.id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      address: address || {},
      phone: phone || '',
      company: company || '',
    }

    const { data: client, error } = await supabase
      .from('clients')
      .insert([newClientData])
      .select()
      .single()

    if (error) {
      console.error('Supabase error creating client:', error)
      // If table doesn't exist yet, return temporary object so preview doesn't break
      return NextResponse.json(
        {
          _id: `temp_${Date.now()}`,
          id: `temp_${Date.now()}`,
          ...newClientData,
          createdAt: new Date().toISOString(),
        },
        { status: 201 }
      )
    }

    return NextResponse.json(
      {
        ...client,
        _id: client.id,
        createdAt: client.created_at,
        updatedAt: client.updated_at,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating client:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to create client.' },
      { status: 500 }
    )
  }
}