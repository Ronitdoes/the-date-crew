import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') });

import { scoreMaleClientMatches, scoreFemaleClientMatches } from '../../services/matching.service';

describe('Matching Engine Calculations', () => {
  describe('Male Client Scoring Logic (Scoring Female Candidates)', () => {
    const mockMaleClient = {
      gender: 'male',
      heightCm: 180,
      annualIncomeInr: 1500000,
      wantKids: 'yes',
      religion: 'Hindu',
      maritalStatus: 'never_married',
      city: 'Mumbai',
      dateOfBirth: '1995-05-15',
    };

    const mockFemaleCandidate = {
      gender: 'female',
      heightCm: 165,
      annualIncomeInr: 900000,
      wantKids: 'yes',
      religion: 'Hindu',
      maritalStatus: 'never_married',
      city: 'Mumbai',
      dateOfBirth: '1998-05-15', // 3 years younger
    };

    it('should compute full match score (100 points) for ideal candidate profiles', () => {
      const score = scoreMaleClientMatches(mockMaleClient, mockFemaleCandidate);
      expect(score).toBe(100);
    });

    it('should compute score with age > 5 years younger (should get 10 pts instead of 20)', () => {
      const candidate = {
        ...mockFemaleCandidate,
        dateOfBirth: '2001-05-15', // 6 years younger
      };
      const score = scoreMaleClientMatches(mockMaleClient, candidate);
      expect(score).toBe(90);
    });

    it('should compute score with same age (should get 0 pts for age)', () => {
      const candidate = {
        ...mockFemaleCandidate,
        dateOfBirth: '1995-05-15', // Same age
      };
      const score = scoreMaleClientMatches(mockMaleClient, candidate);
      expect(score).toBe(80);
    });

    it('should compute score with higher candidate income (should get 0 pts for income)', () => {
      const candidate = {
        ...mockFemaleCandidate,
        annualIncomeInr: 2000000, // Client is 1500000, candidate is higher
      };
      const score = scoreMaleClientMatches(mockMaleClient, candidate);
      expect(score).toBe(85);
    });

    it('should compute score with taller candidate height (should get 0 pts for height)', () => {
      const candidate = {
        ...mockFemaleCandidate,
        heightCm: 185, // Client is 180
      };
      const score = scoreMaleClientMatches(mockMaleClient, candidate);
      expect(score).toBe(90);
    });

    it('should compute score with mismatching kids preference (should get 0 pts for kids)', () => {
      const candidate = {
        ...mockFemaleCandidate,
        wantKids: 'no', // Client is yes
      };
      const score = scoreMaleClientMatches(mockMaleClient, candidate);
      expect(score).toBe(80);
    });

    it('should compute score with different religion (should get 0 pts for religion)', () => {
      const candidate = {
        ...mockFemaleCandidate,
        religion: 'Muslim', // Client is Hindu
      };
      const score = scoreMaleClientMatches(mockMaleClient, candidate);
      expect(score).toBe(85);
    });

    it('should compute score with divorced marital status (should get 0 pts for marital status)', () => {
      const candidate = {
        ...mockFemaleCandidate,
        maritalStatus: 'divorced', // both must be never_married
      };
      const score = scoreMaleClientMatches(mockMaleClient, candidate);
      expect(score).toBe(90);
    });

    it('should compute score with different city but openToRelocate is yes (should get 10 pts)', () => {
      const candidate = {
        ...mockFemaleCandidate,
        city: 'Delhi',
        openToRelocate: 'yes',
      };
      const score = scoreMaleClientMatches(mockMaleClient, candidate);
      expect(score).toBe(100);
    });

    it('should compute score with different city and openToRelocate is no (should get 0 pts)', () => {
      const candidate = {
        ...mockFemaleCandidate,
        city: 'Delhi',
        openToRelocate: 'no',
      };
      const score = scoreMaleClientMatches(mockMaleClient, candidate);
      expect(score).toBe(90);
    });
  });

  describe('Female Client Scoring Logic (Scoring Male Candidates)', () => {
    const mockFemaleClient = {
      gender: 'female',
      incomeTier: '10l_20l',
      familyValues: 'moderate',
      openToRelocate: 'yes',
      religion: 'Hindu',
      dateOfBirth: '1995-05-15',
      diet: 'vegetarian',
      languagesKnown: ['English', 'Hindi'],
    };

    const mockMaleCandidate = {
      gender: 'male',
      incomeTier: '20l_50l', // Higher income tier (matches/higher)
      familyValues: 'moderate',
      openToRelocate: 'yes',
      religion: 'Hindu',
      dateOfBirth: '1996-05-15', // 1 year younger (within ±3 years)
      diet: 'vegetarian',
      languagesKnown: ['Hindi'],
    };

    it('should compute full match score (100 points) for ideal candidate profiles', () => {
      const score = scoreFemaleClientMatches(mockFemaleClient, mockMaleCandidate);
      expect(score).toBe(100);
    });

    it('should compute score with lower income tier (should get 0 pts for profession tier)', () => {
      const candidate = {
        ...mockMaleCandidate,
        incomeTier: '5l_10l', // Client is 10l_20l
      };
      const score = scoreFemaleClientMatches(mockFemaleClient, candidate);
      expect(score).toBe(80);
    });

    it('should compute score with mismatching family values (should get 0 pts)', () => {
      const candidate = {
        ...mockMaleCandidate,
        familyValues: 'traditional', // Client is moderate
      };
      const score = scoreFemaleClientMatches(mockFemaleClient, candidate);
      expect(score).toBe(80);
    });

    it('should compute score with mismatching relocation willingness (should get 0 pts)', () => {
      const candidate = {
        ...mockMaleCandidate,
        openToRelocate: 'no', // Client is yes
      };
      const score = scoreFemaleClientMatches(mockFemaleClient, candidate);
      expect(score).toBe(85);
    });

    it('should compute score with mismatching religion (should get 0 pts)', () => {
      const candidate = {
        ...mockMaleCandidate,
        religion: 'Sikh', // Client is Hindu
      };
      const score = scoreFemaleClientMatches(mockFemaleClient, candidate);
      expect(score).toBe(85);
    });

    it('should compute score with age difference outside ±3 years (should get 0 pts)', () => {
      const candidate = {
        ...mockMaleCandidate,
        dateOfBirth: '1990-05-15', // 5 years older
      };
      const score = scoreFemaleClientMatches(mockFemaleClient, candidate);
      expect(score).toBe(85);
    });

    it('should compute score with different diet (should get 0 pts)', () => {
      const candidate = {
        ...mockMaleCandidate,
        diet: 'non_vegetarian', // Client is vegetarian
      };
      const score = scoreFemaleClientMatches(mockFemaleClient, candidate);
      expect(score).toBe(90);
    });

    it('should compute score with no languages overlapping (should get 0 pts)', () => {
      const candidate = {
        ...mockMaleCandidate,
        languagesKnown: ['Tamil', 'Telugu'], // Client is English, Hindi
      };
      const score = scoreFemaleClientMatches(mockFemaleClient, candidate);
      expect(score).toBe(95);
    });
  });
});
