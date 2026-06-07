import { db } from '../../../../db';
import { customers, poolProfiles, matchActions } from '../../../../db/schema';
import { eq, and, inArray, notInArray } from 'drizzle-orm';
import logger from '../utils/logger';
import { getCompatibilityScoring } from './ai.service';

/**
 * Calculates the age difference between two DOB strings in completed years.
 * If dob2 is younger (born later), the return value is positive.
 */
export function getAgeDifference(dob1Str: string, dob2Str: string): number {
  const dob1 = new Date(dob1Str);
  const dob2 = new Date(dob2Str);
  
  let diff = dob2.getFullYear() - dob1.getFullYear();
  const m = dob2.getMonth() - dob1.getMonth();
  if (m < 0 || (m === 0 && dob2.getDate() < dob1.getDate())) {
    diff--;
  }
  return diff;
}

/**
 * Helper to calculate age in completed years today
 */
export function getAge(dobStr: string): number {
  const today = new Date();
  const birthDate = new Date(dobStr);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Scores a female candidate against a male client.
 * Total points: 100
 */
export function scoreMaleClientMatches(client: any, candidate: any): number {
  let score = 0;

  // 1. Age Profile (20 pts)
  const ageDiff = getAgeDifference(client.dateOfBirth, candidate.dateOfBirth);
  if (ageDiff >= 1 && ageDiff <= 5) {
    score += 20;
  } else if (ageDiff > 5) {
    score += 10;
  }

  // 2. Income (15 pts)
  if (
    candidate.annualIncomeInr !== null &&
    client.annualIncomeInr !== null &&
    candidate.annualIncomeInr < client.annualIncomeInr
  ) {
    score += 15;
  }

  // 3. Height (10 pts)
  if (
    candidate.heightCm !== null &&
    client.heightCm !== null &&
    candidate.heightCm < client.heightCm
  ) {
    score += 10;
  }

  // 4. Kids Preference (20 pts)
  if (candidate.wantKids && client.wantKids && candidate.wantKids === client.wantKids) {
    score += 20;
  }

  // 5. Religion (15 pts)
  if (candidate.religion && client.religion && candidate.religion.toLowerCase() === client.religion.toLowerCase()) {
    score += 15;
  }

  // 6. Marital Status (10 pts)
  if (candidate.maritalStatus === 'never_married' && client.maritalStatus === 'never_married') {
    score += 10;
  }

  // 7. City/Relocation Compatibility (10 pts)
  const sameCity = candidate.city && client.city && candidate.city.toLowerCase() === client.city.toLowerCase();
  const openToRelocate = candidate.openToRelocate === 'yes';
  if (sameCity || openToRelocate) {
    score += 10;
  }

  return score;
}

/**
 * Scores a male candidate against a female client.
 * Total points: 100
 */
export function scoreFemaleClientMatches(client: any, candidate: any): number {
  let score = 0;

  // 1. Profession Tier Compatibility (20 pts)
  const incomeTierRank: Record<string, number> = {
    'below_5l': 1,
    '5l_10l': 2,
    '10l_20l': 3,
    '20l_50l': 4,
    '50l_plus': 5
  };
  const clientRank = client.incomeTier ? (incomeTierRank[client.incomeTier] || 0) : 0;
  const candidateRank = candidate.incomeTier ? (incomeTierRank[candidate.incomeTier] || 0) : 0;
  if (candidateRank >= clientRank) {
    score += 20;
  }

  // 2. Values Alignment (20 pts)
  if (candidate.familyValues && client.familyValues && candidate.familyValues === client.familyValues) {
    score += 20;
  }

  // 3. Relocation Match (15 pts)
  if (candidate.openToRelocate && client.openToRelocate && candidate.openToRelocate === client.openToRelocate) {
    score += 15;
  }

  // 4. Religion Match (15 pts)
  if (candidate.religion && client.religion && candidate.religion.toLowerCase() === client.religion.toLowerCase()) {
    score += 15;
  }

  // 5. Age Proximity (15 pts)
  const ageDiff = Math.abs(getAgeDifference(client.dateOfBirth, candidate.dateOfBirth));
  if (ageDiff <= 3) {
    score += 15;
  }

  // 6. Diet Match (10 pts)
  if (candidate.diet && client.diet && candidate.diet.toLowerCase() === client.diet.toLowerCase()) {
    score += 10;
  }

  // 7. Language Overlap (5 pts)
  const clientLangs = client.languagesKnown || [];
  const candidateLangs = candidate.languagesKnown || [];
  const hasOverlap = clientLangs.some((lang: string) => 
    candidateLangs.some((cLang: string) => cLang.toLowerCase() === lang.toLowerCase())
  );
  if (hasOverlap) {
    score += 5;
  }

  return score;
}

/**
 * Runs the matching flow for a specific client profile.
 */
export async function runMatchingForClient(clientId: string): Promise<any[]> {
  // 1. Fetch client details
  const [client] = await db
    .select({
      id: customers.id,
      matchmakerId: customers.matchmakerId,
      firstName: customers.firstName,
      lastName: customers.lastName,
      gender: customers.gender,
      dateOfBirth: customers.dateOfBirth,
      annualIncomeInr: customers.annualIncomeInr,
      heightCm: customers.heightCm,
      wantKids: customers.wantKids,
      religion: customers.religion,
      maritalStatus: customers.maritalStatus,
      city: customers.city,
      incomeTier: customers.incomeTier,
      familyValues: customers.familyValues,
      openToRelocate: customers.openToRelocate,
      diet: customers.diet,
      languagesKnown: customers.languagesKnown,
      undergradCollege: customers.undergradCollege,
      degree: customers.degree,
      postgradCollege: customers.postgradCollege,
      postgradDegree: customers.postgradDegree,
      currentCompany: customers.currentCompany,
      designation: customers.designation
    })
    .from(customers)
    .where(eq(customers.id, clientId));
  if (!client) {
    throw new Error('Client not found');
  }

  // 2. Get opposite gender
  const oppositeGender = client.gender === 'male' ? 'female' : 'male';

  // 3. Fetch previously recorded match records (action IN ('sent', 'rejected'))
  const existingMatches = await db
    .select({ poolProfileId: matchActions.poolProfileId })
    .from(matchActions)
    .where(
      and(
        eq(matchActions.customerId, clientId),
        inArray(matchActions.action, ['sent', 'rejected'])
      )
    );

  const excludedIds = existingMatches.map(m => m.poolProfileId);

  // 4. Fetch all active pool profiles of the opposite gender
  const whereConditions = [
    eq(poolProfiles.gender, oppositeGender),
    eq(poolProfiles.isActive, true)
  ];
  if (excludedIds.length > 0) {
    whereConditions.push(notInArray(poolProfiles.id, excludedIds));
  }

  const eligibleCandidates = await db
    .select({
      id: poolProfiles.id,
      firstName: poolProfiles.firstName,
      lastName: poolProfiles.lastName,
      gender: poolProfiles.gender,
      dateOfBirth: poolProfiles.dateOfBirth,
      profilePhotoUrl: poolProfiles.profilePhotoUrl,
      city: poolProfiles.city,
      heightCm: poolProfiles.heightCm,
      annualIncomeInr: poolProfiles.annualIncomeInr,
      incomeTier: poolProfiles.incomeTier,
      maritalStatus: poolProfiles.maritalStatus,
      religion: poolProfiles.religion,
      diet: poolProfiles.diet,
      familyValues: poolProfiles.familyValues,
      languagesKnown: poolProfiles.languagesKnown,
      wantKids: poolProfiles.wantKids,
      openToRelocate: poolProfiles.openToRelocate,
      undergradCollege: poolProfiles.undergradCollege,
      degree: poolProfiles.degree,
      currentCompany: poolProfiles.currentCompany,
      designation: poolProfiles.designation,
      isActive: poolProfiles.isActive
    })
    .from(poolProfiles)
    .where(and(...whereConditions));

  // 5. Score candidates
  const scoredCandidates = eligibleCandidates.map(candidate => {
    let score = 0;
    if (client.gender === 'male') {
      score = scoreMaleClientMatches(client, candidate);
    } else if (client.gender === 'female') {
      score = scoreFemaleClientMatches(client, candidate);
    }
    return {
      profile: candidate,
      score
    };
  });

  // 6. Sort by score descending and limit to top 10
  scoredCandidates.sort((a, b) => b.score - a.score);
  const top10 = scoredCandidates.slice(0, 10);

  // 7. Upsert results into match_actions in parallel
  const upsertPromises = top10.map(async (item) => {
    let aiLabel: 'High Potential' | 'Good Fit' | 'Compatible' | 'Tentative';
    let aiReasoning: string;

    try {
      const aiResult = await getCompatibilityScoring(client, item.profile);
      aiReasoning = aiResult.reasoning;
    } catch (err) {
      logger.warn(`Gemini AI compatibility scoring failed for customer ${client.id} and candidate ${item.profile.id}. Using fallback. Error: ${err}`);

      // Fallback Reasoning
      const parts: string[] = [];
      const sameCity = client.city && item.profile.city && client.city.toLowerCase() === item.profile.city.toLowerCase();
      const sameReligion = client.religion && item.profile.religion && client.religion.toLowerCase() === item.profile.religion.toLowerCase();
      const sameDiet = client.diet && item.profile.diet && client.diet.toLowerCase() === item.profile.diet.toLowerCase();
      
      if (sameCity) {
        parts.push(`shared city (${client.city})`);
      }
      if (sameReligion) {
        parts.push(`matching religion (${client.religion}) preferences`);
      }
      if (sameDiet) {
        parts.push(`matching diet (${client.diet})`);
      }

      if (parts.length > 0) {
        const desc = parts.join(' and ');
        aiReasoning = desc.charAt(0).toUpperCase() + desc.slice(1) + '.';
      } else {
        aiReasoning = 'Compatible profile based on age and basic preference alignment.';
      }
    }

    // Determine the label strictly based on the user-defined algorithmic score thresholds:
    // - Above 70 (> 70) => High Potential
    // - Equal to 70 (= 70) => Good Fit
    // - Below 70 and >= 65 => Compatible
    // - Below 65 (e.g. 60) => Tentative
    if (item.score > 70) {
      aiLabel = 'High Potential';
    } else if (item.score === 70) {
      aiLabel = 'Good Fit';
    } else if (item.score >= 65) {
      aiLabel = 'Compatible';
    } else {
      aiLabel = 'Tentative';
    }

    const [actionRecord] = await db
      .insert(matchActions)
      .values({
        customerId: client.id,
        poolProfileId: item.profile.id,
        matchmakerId: client.matchmakerId,
        algoScore: String(item.score),
        aiLabel,
        aiReasoning,
        action: 'suggested'
      })
      .onConflictDoUpdate({
        target: [matchActions.customerId, matchActions.poolProfileId],
        set: {
          algoScore: String(item.score),
          aiLabel,
          aiReasoning,
          action: 'suggested'
        }
      })
      .returning();

    return {
      matchActionId: actionRecord.id,
      score: item.score,
      algoScore: item.score,
      action: actionRecord.action,
      aiLabel: actionRecord.aiLabel,
      aiReasoning: actionRecord.aiReasoning,
      profile: {
        ...item.profile,
        age: getAge(item.profile.dateOfBirth)
      }
    };
  });

  const results = await Promise.all(upsertPromises);

  logger.info(`Ran matches for client ${client.firstName} ${client.lastName} (${clientId}). Generated ${results.length} suggestions.`);
  return results;
}
