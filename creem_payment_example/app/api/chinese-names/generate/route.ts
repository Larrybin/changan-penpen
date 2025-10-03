import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import OpenAI from 'openai';

// Initialize OpenAI/OpenRouter client
const openai = new OpenAI({
  baseURL: process.env.OPENAI_BASE_URL || 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || '',
});

console.log('OpenAI/OpenRouter API configuration:', {
  baseURL: process.env.OPENAI_BASE_URL || 'https://openrouter.ai/api/v1',
  hasApiKey: !!(process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY),
});

interface GenerateNameRequest {
  englishName: string;
  gender: 'male' | 'female' | 'other';
  birthYear?: string;
  personalityTraits?: string;
  namePreferences?: string;
  planType: '1' | '4'; // 1 = Standard, 4 = Premium
  continueBatch?: boolean;
  batchId?: string;
}

interface NameData {
  chinese: string;
  pinyin: string;
  characters: Array<{
    character: string;
    pinyin: string;
    meaning: string;
    explanation: string;
  }>;
  meaning: string;
  culturalNotes: string;
  personalityMatch: string;
  style: string;
}

const SURNAME_LIST = [
  '王','李','张','刘','陈','杨','赵','黄','周','吴',
  '徐','孙','胡','朱','高','林','何','郭','马','罗',
  '梁','宋','郑','谢','韩','唐','冯','于','董','萧',
];

const SURNAME_PINYIN: Record<string, string> = {
  '王': 'Wáng', '李': 'Lǐ', '张': 'Zhāng', '刘': 'Liú', '陈': 'Chén',
  '杨': 'Yáng', '赵': 'Zhào', '黄': 'Huáng', '周': 'Zhōu', '吴': 'Wú',
  '徐': 'Xú', '孙': 'Sūn', '胡': 'Hú', '朱': 'Zhū', '高': 'Gāo',
  '林': 'Lín', '何': 'Hé', '郭': 'Guō', '马': 'Mǎ', '罗': 'Luó',
  '梁': 'Liáng', '宋': 'Sòng', '郑': 'Zhèng', '谢': 'Xiè', '韩': 'Hán',
  '唐': 'Táng', '冯': 'Féng', '于': 'Yú', '董': 'Dǒng', '萧': 'Xiāo',
};

const CHAR_PINYIN: Record<string, string> = {
  '志': 'Zhì', '明': 'Míng', '建': 'Jiàn', '华': 'Huá', '伟': 'Wěi', '强': 'Qiáng',
  '俊': 'Jùn', '杰': 'Jié', '文': 'Wén', '昊': 'Hào', '雅': 'Yǎ', '昆': 'Kūn',
  '美': 'Měi', '丽': 'Lì', '慧': 'Huì', '敏': 'Mǐn', '雨': 'Yǔ', '晴': 'Qíng',
  '诗': 'Shī', '涵': 'Hán', '婉': 'Wǎn', '如': 'Rú', '和': 'Hé', '谐': 'Xié',
  '光': 'Guāng', '希': 'Xī', '望': 'Wàng', '未': 'Wèi', '来': 'Lái', '好': 'Hǎo',
};

const CHAR_MEANING: Record<string, string> = {
  '志': 'Ambition', '明': 'Bright', '建': 'Build', '华': 'Splendor', '伟': 'Great', '强': 'Strength',
  '俊': 'Talented', '杰': 'Outstanding', '文': 'Cultured', '昊': 'Vast sky', '雅': 'Elegant', '昆': 'Harmonious',
  '美': 'Beautiful', '丽': 'Beautiful', '慧': 'Wisdom', '敏': 'Agile', '雨': 'Rain', '晴': 'Clear',
  '诗': 'Poetry', '涵': 'Depth', '婉': 'Graceful', '如': 'As/like', '和': 'Harmony', '谐': 'Harmony',
  '光': 'Light', '希': 'Hope', '望': 'Hope', '未': 'Future', '来': 'Coming', '好': 'Good',
};

function pinyinForChar(ch: string) {
  return CHAR_PINYIN[ch] || 'Míng';
}
function meaningForChar(ch: string) {
  return CHAR_MEANING[ch] || 'Meaningful';
}

export async function POST(request: NextRequest) {
  console.log('=== Chinese Names Generate API Called ===');
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    const body: GenerateNameRequest = await request.json();
    const { englishName, gender, birthYear, personalityTraits, namePreferences, planType, continueBatch, batchId } = body;

    if (!englishName || !gender || !planType) {
      return NextResponse.json(
        { error: 'Missing required fields: englishName, gender, and planType' },
        { status: 400 }
      );
    }

    // IP-based free usage rate limiting for unauthenticated users
    if (!user) {
      const forwarded = request.headers.get('x-forwarded-for');
      const realIp = request.headers.get('x-real-ip');
      const clientIp = forwarded ? forwarded.split(',')[0].trim() : realIp || '127.0.0.1';

      const { data: canGenerate, error: rateLimitError } = await supabase.rpc('check_ip_rate_limit', { p_client_ip: clientIp });
      if (rateLimitError) {
        return NextResponse.json(
          { error: 'Unable to verify rate limit. Please try again.' },
          { status: 500 }
        );
      }
      if (!canGenerate) {
        return NextResponse.json(
          {
            error: 'Free generation limit reached. You can generate 3 free names per day. Please sign in for unlimited access!',
            rateLimited: true,
          },
          { status: 429 }
        );
      }
    }

    // Credit check for authenticated users
    if (user) {
      const creditCost = parseInt(planType);
      const { data: customer, error: fetchError } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching customer:', fetchError);
      } else {
        if (!customer || (customer.credits || 0) < creditCost) {
          return NextResponse.json(
            { error: 'Insufficient credits. Please purchase more credits.' },
            { status: 403 }
          );
        }
        const newCredits = (customer.credits || 0) - creditCost;
        const { error: updateError } = await supabase
          .from('customers')
          .update({ credits: newCredits, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);
        if (updateError) {
          console.error('Credit deduction error:', updateError);
        } else {
          try {
            await supabase
              .from('credits_history')
              .insert({
                customer_id: customer.id,
                amount: creditCost,
                type: 'subtract',
                description: 'chinese_name_generation',
                metadata: {
                  operation: 'chinese_name_generation',
                  credits_before: customer.credits,
                  credits_after: newCredits,
                  plan_type: planType,
                },
              });
          } catch (e) {
            console.error('Failed to record credit transaction:', e);
          }
        }
      }
    }

    const generatedNames = new Set<string>();
    const names: NameData[] = [];
    const nameCount = user ? 6 : 3;

    for (let i = 0; i < nameCount; i++) {
      try {
        const randomSurname = SURNAME_LIST[Math.floor(Math.random() * SURNAME_LIST.length)];
        const randomSeed = Date.now() + Math.random() * 10000 + i * 1000;
        const uniquePromptId = Math.random().toString(36).substring(2, 15);

        let personalInfo = `English Name: ${englishName}`;
        if (birthYear) personalInfo += `\nBirth Year: ${birthYear}`;
        if (personalityTraits && user) personalInfo += `\nPersonality Traits: ${personalityTraits}`;
        if (namePreferences && user) personalInfo += `\nName Preferences: ${namePreferences}`;

        const existingNamesString = generatedNames.size > 0
          ? `\n\nEXISTING NAMES TO AVOID:\n${Array.from(generatedNames).join(', ')}\n- DO NOT generate any of these names\n- Ensure complete uniqueness from existing names`
          : '';

        const prompt = `Generate a Chinese name as JSON only. No text before or after the JSON.

Input Requirements:
- ${personalInfo}
- Gender: ${gender}
- Generation Type: ${planType === '1' ? 'Standard' : 'Premium'}
- Surname: Use "${randomSurname}" as the surname
- Seed: ${randomSeed}
- UniqueID: ${uniquePromptId}
- Position: ${i + 1} of ${nameCount}${existingNamesString}

UNIQUENESS REQUIREMENTS (CRITICAL):
- This name must be 100% unique and different from any existing names
- No duplicate names allowed in this generation batch
- Each name must have distinct character combinations
- Generate completely different names even if same gender

${planType === '4' && user ? `
PREMIUM REQUIREMENTS:
- Deep analysis of personality traits and preferences
- Highly personalized character selection
- Advanced cultural matching
- Sophisticated meaning alignment
` : `
STANDARD REQUIREMENTS:
- Basic personality matching
- Good cultural appropriateness
- Meaningful character selection
`}

CREATIVITY REQUIREMENTS:
- Use uncommon but beautiful Chinese characters
- Avoid typical combinations like 雨晴, 志明, 雅文, 建华, 小明, 美丽, 伟强 etc.
- Be innovative with character selection
- Consider rare but meaningful characters from different radical families
- Create unique phonetic combinations
- Use characters from different categories (nature, virtues, colors, elements, etc.)

Output only this JSON structure:
{
  "chinese": "姓名",
  "pinyin": "Xìngmíng",
  "characters": [
    {
      "character": "姓",
      "pinyin": "Xìng",
      "meaning": "Surname meaning",
      "explanation": "Brief explanation"
    },
    {
      "character": "名",
      "pinyin": "Míng",
      "meaning": "Given name meaning",
      "explanation": "Brief explanation"
    }
  ],
  "meaning": "Overall name meaning",
  "culturalNotes": "Cultural significance",
  "personalityMatch": "Why this name suits the person's traits and preferences",
  "style": "${planType === '4' ? 'Premium' : 'Standard'}"
}

Requirements:
- Generate ABSOLUTELY UNIQUE personalized name
- ${gender} appropriate
- Must be creative, original, and distinct
- Zero tolerance for duplicates
- JSON only, no other text`;

        const completion = await openai.chat.completions.create({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: `You are a Chinese naming expert specializing in ${planType === '4' ? 'premium personalized' : 'standard personalized'} name generation. IMPORTANT: Respond with ONLY valid JSON. No explanations, no markdown, no extra text. Start with { and end with }. Generate creative and unique Chinese names based on personal information.`,
            },
            { role: 'user', content: prompt },
          ],
          temperature: planType === '4' ? 0.9 : 0.8,
          max_tokens: 1200,
          top_p: planType === '4' ? 0.95 : 0.9,
        });

        const responseContent = completion.choices[0]?.message?.content;
        if (!responseContent) throw new Error('No response from AI');

        let generatedName: NameData;
        try {
          let cleanedResponse = responseContent.trim();
          const jsonStartIndex = cleanedResponse.indexOf('{');
          const jsonEndIndex = cleanedResponse.lastIndexOf('}');
          if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
            cleanedResponse = cleanedResponse.substring(jsonStartIndex, jsonEndIndex + 1);
          } else {
            const jsonMatch = cleanedResponse.match(/\{[\s\S]*?\}/);
            if (jsonMatch) cleanedResponse = jsonMatch[0];
            else throw new Error('No valid JSON object found in AI response');
          }

          generatedName = JSON.parse(cleanedResponse);
          if (!generatedName.chinese || !generatedName.pinyin || !generatedName.characters) {
            throw new Error('Missing required fields in AI response');
          }
          generatedName.style = planType === '4' ? 'Premium' : 'Standard';
          if (generatedNames.has(generatedName.chinese)) {
            generatedName = generateFallbackName(i, randomSurname, gender, planType);
          }
          generatedNames.add(generatedName.chinese);
        } catch (e) {
          console.error(`Failed to parse AI response for name ${i + 1}:`, e);
          const fallbackName = generateFallbackName(i, randomSurname, gender, planType);
          generatedNames.add(fallbackName.chinese);
          names.push(fallbackName);
          continue;
        }

        names.push(generatedName);
      } catch (err) {
        console.error(`Error generating name ${i + 1}:`, err);
        const fallbackName = generateFallbackName(i, SURNAME_LIST[i % SURNAME_LIST.length], gender, planType);
        generatedNames.add(fallbackName.chinese);
        names.push(fallbackName);
      }
    }

    // Persist for authenticated users
    let resultBatchId: string | null = null;
    let currentGenerationRound = 1;
    let batch: any = null;

    if (user) {
      try {
        if (continueBatch && batchId) {
          const { data: existingBatch, error: fetchBatchError } = await supabase
            .from('generation_batches')
            .select('*')
            .eq('id', batchId)
            .eq('user_id', user.id)
            .single();
          if (fetchBatchError || !existingBatch) {
            return NextResponse.json({ error: 'Invalid batch ID or batch not found' }, { status: 400 });
          }
          batch = existingBatch;
          resultBatchId = batch.id;

          const { data: maxRoundData, error: maxRoundError } = await supabase
            .from('generated_names')
            .select('generation_round')
            .eq('batch_id', batchId)
            .order('generation_round', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (maxRoundError && (maxRoundError as any).code !== 'PGRST116') {
            console.error('Failed to get max generation round:', maxRoundError);
          }
          currentGenerationRound = ((maxRoundData as any)?.generation_round || 0) + 1;

          const newNamesCount = (batch.names_count || 0) + names.length;
          const newCreditsUsed = (batch.credits_used || 0) + parseInt(planType);
          const { error: updateBatchError } = await supabase
            .from('generation_batches')
            .update({ names_count: newNamesCount, credits_used: newCreditsUsed, updated_at: new Date().toISOString() })
            .eq('id', batchId);
          if (!updateBatchError) {
            batch.names_count = newNamesCount;
            batch.credits_used = newCreditsUsed;
          }
        } else {
          const { data: newBatch, error: batchError } = await supabase
            .from('generation_batches')
            .insert({
              user_id: user.id,
              english_name: englishName,
              gender: gender,
              birth_year: birthYear,
              personality_traits: personalityTraits,
              name_preferences: namePreferences,
              plan_type: planType,
              credits_used: parseInt(planType),
              names_count: names.length,
              generation_metadata: {
                generation_timestamp: new Date().toISOString(),
                ai_model: 'google/gemini-2.5-flash',
                temperature: planType === '4' ? 0.9 : 0.8,
              },
            })
            .select()
            .single();
          if (!batchError) {
            batch = newBatch;
            resultBatchId = newBatch.id;
            currentGenerationRound = 1;
          }
        }

        if (resultBatchId) {
          const namesToInsert = names.map((name, index) => ({
            batch_id: resultBatchId,
            chinese_name: name.chinese,
            pinyin: name.pinyin,
            characters: name.characters,
            meaning: name.meaning,
            cultural_notes: name.culturalNotes,
            personality_match: name.personalityMatch,
            style: name.style,
            position_in_batch: index,
            generation_round: currentGenerationRound,
          }));
          const { error: namesError } = await supabase.from('generated_names').insert(namesToInsert);
          if (namesError) {
            console.error('Failed to save generated names:', namesError);
          }
        }

        await supabase.from('name_generation_logs').insert({
          user_id: user.id,
          plan_type: planType,
          credits_used: parseInt(planType),
          names_generated: names.length,
          english_name: englishName,
          gender: gender,
          birth_year: birthYear,
          has_personality_traits: !!(personalityTraits && user),
          has_name_preferences: !!(namePreferences && user),
          metadata: {
            generation_details: {
              name_count: names.length,
              generation_timestamp: new Date().toISOString(),
              batch_id: resultBatchId,
              generation_round: currentGenerationRound,
              is_continuation: continueBatch || false,
            },
          },
        });
      } catch (e) {
        console.error('Failed to save generation batch:', e);
      }
    }

    return NextResponse.json({
      names,
      total: names.length,
      planType,
      creditsUsed: user ? parseInt(planType) : 0,
      batchId: resultBatchId,
      generationRound: currentGenerationRound,
      isContinuation: continueBatch || false,
      batch: batch
        ? {
            id: batch.id,
            englishName: batch.english_name,
            gender: batch.gender,
            planType: batch.plan_type,
            totalNamesGenerated: batch.names_count,
            totalCreditsUsed: batch.credits_used,
            createdAt: batch.created_at,
          }
        : null,
      message: continueBatch
        ? `Generated ${names.length} more names for your batch (Round ${currentGenerationRound})!`
        : `Generated ${names.length} unique Chinese names successfully!`,
    });
  } catch (error) {
    console.error('Name generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate names. Please try again.' },
      { status: 500 }
    );
  }
}

// Helper function to generate fallback names
function generateFallbackName(index: number, surname: string, gender: string, planType: string): NameData {
  const fallbackGivenNames = {
    male: ['志明', '建华', '伟强', '俊杰', '文昊', '雅昆'],
    female: ['雅文', '美丽', '慧敏', '雨晴', '诗涵', '婉如'],
    other: ['明智', '美好', '和谐', '光明', '希望', '未来'],
  } as const;

  const genderKey = gender === 'male' ? 'male' : gender === 'female' ? 'female' : 'other';
  const givenNames = fallbackGivenNames[genderKey];
  const selectedGivenName = givenNames[index % givenNames.length];

  const surnamePinyin = SURNAME_PINYIN[surname] || 'Wáng';
  const givenChar1 = selectedGivenName[0];
  const givenChar2 = selectedGivenName[1] || '';

  const fullPinyin = `${surnamePinyin} ${pinyinForChar(givenChar1)}${givenChar2 ? pinyinForChar(givenChar2) : ''}`;

  const characters = [
    {
      character: surname,
      pinyin: surnamePinyin,
      meaning: 'Family surname',
      explanation: 'A traditional Chinese family name with historical significance.',
    },
    {
      character: givenChar1,
      pinyin: pinyinForChar(givenChar1),
      meaning: meaningForChar(givenChar1),
      explanation: `Represents ${meaningForChar(givenChar1).toLowerCase()} qualities`,
    },
    ...(givenChar2
      ? [
          {
            character: givenChar2,
            pinyin: pinyinForChar(givenChar2),
            meaning: meaningForChar(givenChar2),
            explanation: `Symbolizes ${meaningForChar(givenChar2).toLowerCase()} qualities`,
          },
        ]
      : []),
  ];

  return {
    chinese: `${surname}${selectedGivenName}`,
    pinyin: fullPinyin,
    characters,
    meaning: `A ${planType === '4' ? 'premium' : 'standard'} Chinese name with positive meanings and cultural significance`,
    culturalNotes: `Traditional Chinese name reflecting ${gender} characteristics with auspicious meanings`,
    personalityMatch: 'This fallback name maintains cultural appropriateness and positive connotations suitable for the specified preferences',
    style: planType === '4' ? 'Premium' : 'Standard',
  };
}

