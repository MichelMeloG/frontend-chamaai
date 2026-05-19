export type UserType = 'client' | 'provider'

export interface User {
  id: string
  name: string
  email: string
  cpf: string
  type: UserType
}

export interface Service {
  id: string
  title: string
  description: string
  price: number
  user_id: string
}

export interface RequestItem {
  id: string
  description: string
  status: string
}

export interface MessageItem {
  id: string
  sender_id: string
  receiver_id: string
  content: string
}

export interface ProfileData {
  id: string
  bio: string | null
  category: string | null
  rating: number | null
  user_id: string
}

export type ApiDetail =
  | string
  | { msg?: string }
  | Array<string | { msg?: string }>
  | null
  | undefined
