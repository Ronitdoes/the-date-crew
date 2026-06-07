import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../../../.env') });

const mockGenerateContent = jest.fn();

// Mock the Gemini API SDK
jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => {
      return {
        getGenerativeModel: () => {
          return {
            generateContent: mockGenerateContent,
          };
        },
      };
    }),
  };
});

import { getCompatibilityScoring, generateIntroEmail } from '../../services/ai.service';

describe('Gemini AI Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should request compatibility scoring and return parsed response', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => JSON.stringify({
          label: 'Compatible',
          reasoning: 'Good match.'
        }),
      },
    });

    const result = await getCompatibilityScoring({ name: 'Rahul' }, { name: 'Priya' });
    expect(result).toEqual({
      label: 'Compatible',
      reasoning: 'Good match.'
    });
  });

  it('should clean markdown code block wrap in response text', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => '```json\n{\n  "label": "High Potential",\n  "reasoning": "Resilient parsing test."\n}\n```',
      },
    });

    const result = await getCompatibilityScoring({ name: 'Rahul' }, { name: 'Priya' });
    expect(result).toEqual({
      label: 'High Potential',
      reasoning: 'Resilient parsing test.'
    });
  });

  it('should request introduction email and return parsed response', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => JSON.stringify({
          subject: 'Introduction Email Subject',
          body: 'Introduction Email Body'
        }),
      },
    });

    const result = await generateIntroEmail({ name: 'Rahul' }, { name: 'Priya' });
    expect(result).toEqual({
      subject: 'Introduction Email Subject',
      body: 'Introduction Email Body'
    });
  });
});
