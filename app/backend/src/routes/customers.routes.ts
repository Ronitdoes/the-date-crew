import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { aiRateLimiter } from '../middleware/rate-limit.middleware';
import {
  getCustomers,
  getCustomersStats,
  getCustomerById,
  createCustomer,
  updateCustomer,
  patchJourneyStage,
} from '../controllers/customers.controller';
import {
  getCustomerNotes,
  createCustomerNote,
} from '../controllers/notes.controller';
import { runMatches } from '../controllers/matches.controller';

const router = Router();
router.use(requireAuth);

const genderEnum = z.enum(['male', 'female', 'other']);
const maritalStatusEnum = z.enum(['never_married', 'divorced', 'widowed', 'separated']);
const manglikEnum = z.enum(['yes', 'no', 'anshik', 'dont_matter']);
const dietEnum = z.enum(['vegetarian', 'non_vegetarian', 'eggetarian', 'jain', 'vegan']);
const drinkingEnum = z.enum(['never', 'occasionally', 'yes']);
const smokingEnum = z.enum(['never', 'occasionally', 'yes']);
const familyTypeEnum = z.enum(['nuclear', 'joint', 'extended']);
const familyValuesEnum = z.enum(['traditional', 'moderate', 'liberal']);
const wantKidsEnum = z.enum(['yes', 'no', 'maybe']);
const openToRelocateEnum = z.enum(['yes', 'no', 'maybe']);
const openToPetsEnum = z.enum(['yes', 'no', 'maybe']);
const journeyStageEnum = z.enum(['onboarding', 'active', 'match_sent', 'matched', 'closed', 'paused']);

const createCustomerSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    gender: genderEnum,
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format'),
    profilePhotoUrl: z.string().url().optional().nullable(),
    email: z.string().email().optional().nullable(),
    phoneNumber: z.string().optional().nullable(),
    country: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    heightCm: z.number().int().positive().optional().nullable(),
    weightKg: z.number().int().positive().optional().nullable(),
    undergradCollege: z.string().optional().nullable(),
    degree: z.string().optional().nullable(),
    postgradCollege: z.string().optional().nullable(),
    postgradDegree: z.string().optional().nullable(),
    currentCompany: z.string().optional().nullable(),
    designation: z.string().optional().nullable(),
    annualIncomeInr: z.number().int().nonnegative().optional().nullable(),
    incomeTier: z.enum(['below_5l', '5l_10l', '10l_20l', '20l_50l', '50l_plus']).optional().nullable(),
    maritalStatus: maritalStatusEnum.optional().nullable(),
    siblings: z.number().int().nonnegative().default(0),
    caste: z.string().optional().nullable(),
    subCaste: z.string().optional().nullable(),
    religion: z.string().optional().nullable(),
    motherTongue: z.string().optional().nullable(),
    gotra: z.string().optional().nullable(),
    manglik: manglikEnum.optional().nullable(),
    horoscopeRequired: z.boolean().default(false),
    diet: dietEnum.optional().nullable(),
    drinking: drinkingEnum.optional().nullable(),
    smoking: smokingEnum.optional().nullable(),
    familyType: familyTypeEnum.optional().nullable(),
    familyValues: familyValuesEnum.optional().nullable(),
    languagesKnown: z.array(z.string()).optional(),
    wantKids: wantKidsEnum.optional().nullable(),
    openToRelocate: openToRelocateEnum.optional().nullable(),
    openToPets: openToPetsEnum.optional().nullable(),
    willingToSettleAbroad: z.boolean().default(false),
    preferredAgeMin: z.number().int().positive().optional().nullable(),
    preferredAgeMax: z.number().int().positive().optional().nullable(),
    preferredHeightMin: z.number().int().positive().optional().nullable(),
    preferredReligion: z.array(z.string()).optional(),
    preferredCaste: z.array(z.string()).optional(),
    preferredCity: z.array(z.string()).optional(),
    aboutMe: z.string().optional().nullable(),
    physicallyChallenged: z.boolean().default(false),
  }),
});

const updateCustomerSchema = z.object({
  body: createCustomerSchema.shape.body.partial(),
});

const patchStageSchema = z.object({
  body: z.object({
    journeyStage: journeyStageEnum,
  }),
});

const createNoteSchema = z.object({
  body: z.object({
    content: z.string().min(1, 'Note content is required'),
    noteType: z.enum(['general', 'call', 'meeting', 'email', 'observation']).default('general'),
  }),
});

// Customer CRUD
router.get('/', getCustomers);
router.get('/stats', getCustomersStats);
router.get('/:id', getCustomerById);
router.post('/', validateRequest(createCustomerSchema), createCustomer);
router.put('/:id', validateRequest(updateCustomerSchema), updateCustomer);
router.patch('/:id/stage', validateRequest(patchStageSchema), patchJourneyStage);

// Customer Notes
router.get('/:id/notes', getCustomerNotes);
router.post('/:id/notes', validateRequest(createNoteSchema), createCustomerNote);

// Matching Algorithm
router.post('/:id/matches/run', aiRateLimiter, runMatches);

export default router;
