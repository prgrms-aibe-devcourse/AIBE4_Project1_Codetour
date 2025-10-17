const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");

dotenv.config();

const {
  SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey,
  SUPABASE_URL: supabaseUrl
} = process.env;

// Server-side client with service role key for elevated permissions
const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = supabase;
