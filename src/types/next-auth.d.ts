import { DefaultSession, DefaultUser } from 'next-auth'
import { DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface User extends DefaultUser {
    phone?: string
    role?: string
    shopName?: string
  }

  interface Session {
    user: {
      id: string
      phone: string
      role: string
      shopName: string
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    role?: string
    phone?: string
    shopName?: string
  }
}
