'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/login?status=failed&error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: signUpData, error } = await supabase.auth.signUp(data)

  if (error) {
    redirect('/login?status=failed&error=' + encodeURIComponent(error.message))
  }

  if (signUpData.user && signUpData.user.identities?.length === 0) {
    redirect('/login?status=similar&error=' + encodeURIComponent('An account with this email already exists. Try logging in instead.'))
  }

  revalidatePath('/', 'layout')
  redirect('/login?status=success&message=' + encodeURIComponent('Account created! Please check your email to confirm your account.'))
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
