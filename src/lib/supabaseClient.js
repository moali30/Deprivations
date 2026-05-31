import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://iqmfmygowlgajukmzrjb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxbWZteWdvd2xnYWp1a216cmpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMzAzODgsImV4cCI6MjA5NTgwNjM4OH0.9q1a4xIrx3Vj-Ed79-56tLzQDqtTPf2oVjysGRb-CB8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
