import {createClient} from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

console.log("checkong :", process.env.SUPABASE_URL,process.env.SUPABASE_PUBLISHABLE_KEY);

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_PUBLISHABLE_KEY,
)

export default supabase;