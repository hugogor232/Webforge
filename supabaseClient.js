import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SUPABASE_URL = 'https://wyxmqmziuevztjqysjfv.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5eG1xbXppdWV2enRqcXlzamZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MDkxNDksImV4cCI6MjA3OTk4NTE0OX0.l4TDGAnUsJn6ZU5u7-iu6cox-sFE1Echg-csgJ1f2MY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)