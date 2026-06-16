import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://njdcvqdkxyeidifgdmzz.supabase.co"
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qZGN2cWRreHllaWRpZmdkbXp6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODQ1MDEzNywiZXhwIjoyMDY0MDI2MTM3fQ.uLpFHC92JYjCMcXgOw6Q89cR0ulk0-e0CEocGhFRXvM"

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createAdmin() {
  const email = "javier@cerouno.digital"
  const password = "Sistemas2020##"
  const fullName = "Javier Mayorga"
  const role = "admin"

  console.log(`Checking if user ${email} exists...`)
  const { data: existingProfiles, error: checkError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)

  if (existingProfiles && existingProfiles.length > 0) {
    console.log("Profile already exists! Updating password and role...")
    const userId = existingProfiles[0].id
    
    // Update Auth
    const { error: authUpdateError } = await supabase.auth.admin.updateUserById(userId, {
      password: password,
      user_metadata: { role: role, full_name: fullName }
    })
    
    if (authUpdateError) {
      console.error("Failed to update auth:", authUpdateError)
      return
    }

    // Update Profile
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ role: role })
      .eq('id', userId)

    if (profileUpdateError) {
      console.error("Failed to update profile:", profileUpdateError)
      return
    }

    console.log("Successfully updated existing user to admin with new password!")
    return
  }

  console.log("Creating new user in Auth...")
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: role
    }
  })

  if (authError) {
    console.error("Failed to create auth user:", authError)
    return
  }

  console.log("User created in Auth with ID:", authData.user.id)
  
  const { error: profileError } = await supabase.from('profiles').insert({
    id: authData.user.id,
    email: email,
    full_name: fullName,
    role: role
  })

  if (profileError) {
    console.error("Failed to create profile:", profileError)
    return
  }

  console.log("Successfully created admin user!")
}

createAdmin().catch(console.error)
