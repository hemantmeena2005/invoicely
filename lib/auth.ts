import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { supabase } from './supabase'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'demo-login',
      name: 'Demo Account',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'demo@invoicely.app' },
        name: { label: 'Name', type: 'text', placeholder: 'John Doe' },
        upiId: { label: 'UPI ID', type: 'text', placeholder: 'demo@upi' },
        upiName: { label: 'Payee Name', type: 'text', placeholder: 'John Doe' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase() || 'demo@invoicely.app'
        const name = credentials?.name?.trim() || 'John Doe'
        const upiId = credentials?.upiId?.trim() || process.env.NEXT_PUBLIC_DEFAULT_UPI_ID || 'demo@upi'
        const upiName = credentials?.upiName?.trim() || name
        const userId = `demo_${email.replace(/[^a-zA-Z0-9]/g, '_')}`

        try {
          // Check or create in Supabase
          const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single()

          if (existingUser) {
            // Update UPI ID or Name if user explicitly supplied new ones
            if (credentials?.upiId || credentials?.name) {
              await supabase
                .from('users')
                .update({
                  name,
                  upi_id: upiId,
                  upi_name: upiName,
                })
                .eq('id', existingUser.id)
            }

            return {
              id: existingUser.id,
              name: existingUser.name,
              email: existingUser.email,
              image: existingUser.image,
            }
          }

          // Insert demo user with UPI details
          const { data: createdUser } = await supabase
            .from('users')
            .upsert([
              {
                id: userId,
                name,
                email,
                upi_id: upiId,
                upi_name: upiName,
                image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
              },
            ])
            .select()
            .single()

          return {
            id: createdUser?.id || userId,
            name: createdUser?.name || name,
            email: createdUser?.email || email,
            image: createdUser?.image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
          }
        } catch (error) {
          console.error('Supabase Demo Auth error (fallback active):', error)
          return {
            id: userId,
            name,
            email,
            image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
          }
        }
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id
        if (user.name) token.name = user.name
      }
      if (token.name === 'Hemant Meena') {
        token.name = 'John Doe'
      }
      return token
    },
    session: async ({ session, token }: any) => {
      if (session?.user && token) {
        session.user.id = token.id || token.sub
        if (session.user.name === 'Hemant Meena') {
          session.user.name = 'John Doe'
        }
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET || 'invoicely_demo_super_secret_session_key_123',
}

export default NextAuth(authOptions)