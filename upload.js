import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://iqmfmygowlgajukmzrjb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxbWZteWdvd2xnYWp1a216cmpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMzAzODgsImV4cCI6MjA5NTgwNjM4OH0.9q1a4xIrx3Vj-Ed79-56tLzQDqtTPf2oVjysGRb-CB8';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  try {
    const content = fs.readFileSync('Subjects.md', 'utf8');
    const subjects = content.split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace('-', '').trim());

    console.log(`Found ${subjects.length} subjects. Uploading...`);

    let okCount = 0;
    for (const sub of subjects) {
      if (!sub) continue;
      const { data, error } = await supabase.from('subjects').insert([{ name: sub }]);
      if (error) {
        if (error.code === '23505') {
          console.log(`[SKIP] Already exists: ${sub}`);
        } else {
          console.error(`[ERROR] ${sub}:`, error.message);
        }
      } else {
        console.log(`[OK] Inserted: ${sub}`);
        okCount++;
      }
    }
    console.log(`Done! Inserted ${okCount} new subjects.`);
  } catch (err) {
    console.error('Fatal error:', err.message);
  }
}

main();
