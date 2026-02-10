
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const SUPABASE_URL = 'https://srcwjsqfdrywrxujuauu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyY3dqc3FmZHJ5d3J4dWp1YXV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NjkyNTAsImV4cCI6MjA4MzE0NTI1MH0.1OkDzluUeBX2nSB7rWbW5JqqYoq1nBLFUknYCvb2Om8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
