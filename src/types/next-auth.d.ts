import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      uuid: string
      email: string
      nickname: string
      profile_image_url: string | null
      image: string | null
    }
  }
}
