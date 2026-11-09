import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from './prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'OTP Login',
      credentials: {
        phone: { label: 'Phone', type: 'text' },
        otp: { label: 'OTP', type: 'text' },
      },
      async authorize(credentials) {
        const phone = credentials?.phone as string
        const otp = credentials?.otp as string

        // In production, verify OTP via SMS gateway
        // For demo, accept "123456"
        if (otp !== '123456') {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { phone },
        })

        if (!user) return null

        return {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          shopName: user.shopName ?? undefined,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.phone = (user as any).phone
        token.shopName = (user as any).shopName
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).id = token.sub
        ;(session.user as any).role = token.role
        ;(session.user as any).phone = token.phone
        ;(session.user as any).shopName = token.shopName
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
})
