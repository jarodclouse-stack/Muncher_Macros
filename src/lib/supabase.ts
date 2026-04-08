import { createClient } from '@supabase/supabase-js';

// Extracted from original app
const SUPABASE_URL = 'https://tqpqwcesdhjhytrryrwp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxcHF3Y2VzZGhqaHl0cnJ5cndwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MjAxNzYsImV4cCI6MjA4OTk5NjE3Nn0.yrLjT_FrzNARUrZefTkikkO4E7SP3fB_c08_xM0gVsc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
