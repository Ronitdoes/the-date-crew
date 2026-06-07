import { db } from '../index'; // Drizzle client
import { poolProfiles } from '../schema/pool_profiles';
import { matchActions } from '../schema/match_actions';
import { faker } from '@faker-js/faker';

async function seedPool() {
  console.log('Cleaning existing match actions and pool profiles...');
  try {
    // Clear existing data to prevent duplicate or mismatched counts
    await db.delete(matchActions);
    await db.delete(poolProfiles);
    console.log('Database cleared for pool profiles seed.');

    const profiles = [];
    const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai'];
    const religions = ['Hindu', 'Muslim', 'Sikh', 'Christian', 'Jain'];
    const motherTongues = ['Hindi', 'Marathi', 'Kannada', 'Punjabi', 'Telugu', 'Tamil'];
    const diets = ['vegetarian', 'non_vegetarian', 'eggetarian', 'jain', 'vegan'];
    const castes = ['Brahmin', 'Kshatriya', 'Vaishya', 'Kayastha', 'Nair', 'Reddy', 'Grover', 'Sharma', 'Patel'];
    const gotras = ['Kashyap', 'Bharadwaj', 'Vashishta', 'Vishwamitra', 'Atri', 'Gautam'];

    const undergradColleges = ['IIT Bombay', 'BITS Pilani', 'Delhi University', 'RVCE Bangalore', 'COEP Pune', 'SRM University'];
    const degrees = ['B.Tech', 'B.E.', 'B.Sc', 'B.Com', 'B.A.', 'BBA', 'BCA'];
    const companies = ['Google', 'Microsoft', 'TCS', 'Infosys', 'HDFC Bank', 'Flipkart', 'Zomato'];
    const designations = ['Software Engineer', 'Product Manager', 'Data Analyst', 'HR Manager', 'Sales Lead', 'Consultant'];

    for (let i = 0; i < 200; i++) {
      const isFemale = i < 100;
      
      // Determine height based on gender (men average taller)
      const heightCm = isFemale 
        ? faker.number.int({ min: 148, max: 172 }) 
        : faker.number.int({ min: 162, max: 190 });

      // Determine weight
      const weightKg = isFemale 
        ? faker.number.int({ min: 45, max: 70 }) 
        : faker.number.int({ min: 60, max: 95 });

      // Generate consistent income and income tier
      const annualIncomeInr = faker.number.int({ min: 350000, max: 7500000 });
      let incomeTier = 'below_5l';
      if (annualIncomeInr >= 5000000) {
        incomeTier = '50l_plus';
      } else if (annualIncomeInr >= 2000000) {
        incomeTier = '20l_50l';
      } else if (annualIncomeInr >= 1000000) {
        incomeTier = '10l_20l';
      } else if (annualIncomeInr >= 500000) {
        incomeTier = '5l_10l';
      }

      const religion = faker.helpers.arrayElement(religions);

      profiles.push({
        firstName: faker.person.firstName(isFemale ? 'female' : 'male'),
        lastName: faker.person.lastName(),
        gender: isFemale ? 'female' : 'male',
        dateOfBirth: faker.date.birthdate({ min: 22, max: 38, mode: 'age' }).toISOString().split('T')[0],
        profilePhotoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${faker.string.alphanumeric(10)}`,
        email: faker.internet.email(),
        phoneNumber: faker.phone.number(),
        country: 'India',
        city: faker.helpers.arrayElement(cities),
        heightCm,
        weightKg,
        undergradCollege: faker.helpers.arrayElement(undergradColleges),
        degree: faker.helpers.arrayElement(degrees),
        currentCompany: faker.helpers.arrayElement(companies),
        designation: faker.helpers.arrayElement(designations),
        annualIncomeInr: Number(annualIncomeInr), // Drizzle bigint mode: 'number' expects a number
        incomeTier,
        maritalStatus: 'never_married',
        siblings: faker.number.int({ min: 0, max: 3 }),
        caste: religion === 'Hindu' ? faker.helpers.arrayElement(castes) : null,
        subCaste: null,
        religion,
        motherTongue: faker.helpers.arrayElement(motherTongues),
        gotra: religion === 'Hindu' ? faker.helpers.arrayElement(gotras) : null,
        manglik: religion === 'Hindu' ? faker.helpers.arrayElement(['yes', 'no', 'anshik', 'dont_matter']) : 'no',
        horoscopeRequired: faker.datatype.boolean({ probability: 0.3 }),
        diet: faker.helpers.arrayElement(diets),
        drinking: faker.helpers.arrayElement(['never', 'occasionally', 'yes']),
        smoking: faker.helpers.arrayElement(['never', 'occasionally', 'yes']),
        familyType: faker.helpers.arrayElement(['nuclear', 'joint', 'extended']),
        familyValues: faker.helpers.arrayElement(['traditional', 'moderate', 'liberal']),
        languagesKnown: faker.helpers.arrayElements(['English', 'Hindi', 'Marathi', 'Punjabi', 'Tamil', 'Telugu', 'Kannada'], { min: 2, max: 4 }),
        wantKids: faker.helpers.arrayElement(['yes', 'no', 'maybe']),
        openToRelocate: faker.helpers.arrayElement(['yes', 'no', 'maybe']),
        openToPets: faker.helpers.arrayElement(['yes', 'no', 'maybe']),
        aboutMe: `Hi, I am a family-oriented individual working as a ${faker.person.jobTitle().toLowerCase()}. I enjoy reading, traveling, and exploring new things. Looking for a partner who shares similar values and life goals.`,
        physicallyChallenged: faker.datatype.boolean({ probability: 0.03 }),
        isActive: true,
      });
    }

    await db.insert(poolProfiles).values(profiles);
    console.log('Seeded 200 pool profiles successfully (100 males and 100 females).');
  } catch (error) {
    console.error('Error seeding pool profiles:', error);
  }
}

seedPool().then(() => process.exit(0));
