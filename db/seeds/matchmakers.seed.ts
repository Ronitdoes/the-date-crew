import { db } from '../index';
import { matchmakers } from '../schema/matchmakers';

async function seedMatchmakers() {
  console.log('Seeding matchmakers...');
  try {
    const dummyMatchmaker = {
      id: '11111111-1111-1111-1111-111111111111',
      authId: '00000000-0000-0000-0000-000000000000', // standard mock auth UUID for development
      fullName: 'Priya Sharma',
      email: 'matchmaker@tdc.com',
    };

    await db.insert(matchmakers).values(dummyMatchmaker).onConflictDoNothing();
    console.log('Seeded matchmaker Priya Sharma.');
  } catch (error) {
    console.error('Error seeding matchmaker:', error);
  }
}

seedMatchmakers().then(() => process.exit(0));
