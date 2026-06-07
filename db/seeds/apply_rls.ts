import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const connectionString = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL || '';

if (!connectionString) {
  throw new Error('Database connection URL is missing in environment variables.');
}

const sql = postgres(connectionString);

async function applyRLS() {
  console.log('Enabling Row-Level Security (RLS) and applying policies...');
  try {
    await sql.unsafe(`
      ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
      ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
      ALTER TABLE match_actions ENABLE ROW LEVEL SECURITY;
    `);
    
    const policies = [
      { name: 'matchmaker_select_own_customers', table: 'customers' },
      { name: 'matchmaker_insert_own_customers', table: 'customers' },
      { name: 'matchmaker_update_own_customers', table: 'customers' },
      { name: 'matchmaker_delete_own_customers', table: 'customers' },
      
      { name: 'matchmaker_select_own_notes', table: 'notes' },
      { name: 'matchmaker_insert_own_notes', table: 'notes' },
      { name: 'matchmaker_update_own_notes', table: 'notes' },
      { name: 'matchmaker_delete_own_notes', table: 'notes' },
      
      { name: 'matchmaker_select_own_match_actions', table: 'match_actions' },
      { name: 'matchmaker_insert_own_match_actions', table: 'match_actions' },
      { name: 'matchmaker_update_own_match_actions', table: 'match_actions' },
      { name: 'matchmaker_delete_own_match_actions', table: 'match_actions' }
    ];

    for (const policy of policies) {
      await sql.unsafe(`DROP POLICY IF EXISTS ${policy.name} ON ${policy.table};`);
    }

    await sql.unsafe(`
      CREATE POLICY matchmaker_select_own_customers ON customers
        FOR SELECT
        TO authenticated
        USING (matchmaker_id = (SELECT id FROM matchmakers WHERE auth_id = (SELECT auth.uid())));

      CREATE POLICY matchmaker_insert_own_customers ON customers
        FOR INSERT
        TO authenticated
        WITH CHECK (matchmaker_id = (SELECT id FROM matchmakers WHERE auth_id = (SELECT auth.uid())));

      CREATE POLICY matchmaker_update_own_customers ON customers
        FOR UPDATE
        TO authenticated
        USING (matchmaker_id = (SELECT id FROM matchmakers WHERE auth_id = (SELECT auth.uid())))
        WITH CHECK (matchmaker_id = (SELECT id FROM matchmakers WHERE auth_id = (SELECT auth.uid())));

      CREATE POLICY matchmaker_delete_own_customers ON customers
        FOR DELETE
        TO authenticated
        USING (matchmaker_id = (SELECT id FROM matchmakers WHERE auth_id = (SELECT auth.uid())));

      CREATE POLICY matchmaker_select_own_notes ON notes
        FOR SELECT
        TO authenticated
        USING (matchmaker_id = (SELECT id FROM matchmakers WHERE auth_id = (SELECT auth.uid())));

      CREATE POLICY matchmaker_insert_own_notes ON notes
        FOR INSERT
        TO authenticated
        WITH CHECK (matchmaker_id = (SELECT id FROM matchmakers WHERE auth_id = (SELECT auth.uid())));

      CREATE POLICY matchmaker_update_own_notes ON notes
        FOR UPDATE
        TO authenticated
        USING (matchmaker_id = (SELECT id FROM matchmakers WHERE auth_id = (SELECT auth.uid())))
        WITH CHECK (matchmaker_id = (SELECT id FROM matchmakers WHERE auth_id = (SELECT auth.uid())));

      CREATE POLICY matchmaker_delete_own_notes ON notes
        FOR DELETE
        TO authenticated
        USING (matchmaker_id = (SELECT id FROM matchmakers WHERE auth_id = (SELECT auth.uid())));

      CREATE POLICY matchmaker_select_own_match_actions ON match_actions
        FOR SELECT
        TO authenticated
        USING (matchmaker_id = (SELECT id FROM matchmakers WHERE auth_id = (SELECT auth.uid())));

      CREATE POLICY matchmaker_insert_own_match_actions ON match_actions
        FOR INSERT
        TO authenticated
        WITH CHECK (matchmaker_id = (SELECT id FROM matchmakers WHERE auth_id = (SELECT auth.uid())));

      CREATE POLICY matchmaker_update_own_match_actions ON match_actions
        FOR UPDATE
        TO authenticated
        USING (matchmaker_id = (SELECT id FROM matchmakers WHERE auth_id = (SELECT auth.uid())))
        WITH CHECK (matchmaker_id = (SELECT id FROM matchmakers WHERE auth_id = (SELECT auth.uid())));

      CREATE POLICY matchmaker_delete_own_match_actions ON match_actions
        FOR DELETE
        TO authenticated
        USING (matchmaker_id = (SELECT id FROM matchmakers WHERE auth_id = (SELECT auth.uid())));
    `);

    console.log('Row-Level Security (RLS) policies applied successfully to customers, notes, and match_actions.');
  } catch (error) {
    console.error('Error applying RLS policies:', error);
  } finally {
    await sql.end();
  }
}

applyRLS();
