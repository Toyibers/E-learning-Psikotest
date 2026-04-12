import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://atzfmfmriuebdwqfxuui.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0emZtZm1yaXVlYmR3cWZ4dXVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3Njg3NTksImV4cCI6MjA5MTM0NDc1OX0.tSuHD7U5OBoHIE2mcWztgnLQFkFgjhP6Uu3UpKz6si8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
