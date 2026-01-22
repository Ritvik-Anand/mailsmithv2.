import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateIcebreaker(leadData: any) {
    const {
        first_name,
        company_name,
        job_title,
        enrichment_data
    } = leadData;

    const companyDescription = enrichment_data?.company_description || '';
    const headline = enrichment_data?.headline || '';

    const prompt = `
    You are an expert sales copywriter. Your task is to write a personalized, 1-sentence "icebreaker" for a cold email.
    
    Target Lead:
    - Name: ${first_name}
    - Job Title: ${job_title}
    - Company: ${company_name}
    - Headline: ${headline}
    - Company Description: ${companyDescription}
    
    Rules:
    1. Be concise (one sentence, max 15-20 words).
    2. Be specific to their company or role.
    3. Don't be "salesy". Use a professional yet casual tone.
    4. Focus on a recent achievement, their specific role's challenge, or something unique about their company.
    5. Don't use placeholders like [Company].
    6. Return ONLY the icebreaker text. No preamble, no quotes.
    
    Example: "I noticed ${company_name} is scaling their engineering team in Austin—impressive growth!"
    
    Icebreaker:
  `;

    try {
        const message = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20240620',
            max_tokens: 100,
            messages: [
                { role: 'user', content: prompt }
            ],
        });

        const content = message.content[0];
        if (content.type === 'text') {
            return content.text.trim().replace(/^"|"$/g, '');
        }
        return null;
    } catch (error) {
        console.error('Anthropic API Error:', error);
        throw error;
    }
}
