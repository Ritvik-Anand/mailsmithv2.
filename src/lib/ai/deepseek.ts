import OpenAI from 'openai';
import { createAdminClient } from '@/lib/supabase/admin';

const deepseek = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com',
});

/**
 * Build prospect info string from raw scraped data
 */
function buildProspectInfo(leadData: any): string {
    const {
        first_name,
        last_name,
        company_name,
        job_title,
        raw_scraped_data,
    } = leadData;

    // Extract all useful info from raw_scraped_data
    const raw = raw_scraped_data || {};

    const parts = [
        first_name,
        last_name,
        company_name,
        job_title,
    ];

    // Add all relevant fields from raw data
    const relevantFields = [
        'headline',
        'company_description',
        'company_industry',
        'company_linkedin',
        'company_website',
        'company_total_funding',
        'company_annual_revenue',
        'company_founded_year',
        'company_technologies',
        'seniority_level',
        'functional_level',
        'location',
        'city',
        'state',
        'country',
    ];

    for (const field of relevantFields) {
        if (raw[field] && typeof raw[field] === 'string') {
            parts.push(raw[field]);
        } else if (raw[field] && Array.isArray(raw[field])) {
            parts.push(raw[field].join(', '));
        }
    }

    return parts.filter(Boolean).join(', ');
}

/**
 * Get customer context for icebreaker personalization
 */
async function getCustomerContext(organizationId: string): Promise<any> {
    try {
        const supabase = createAdminClient();

        const { data: org, error } = await supabase
            .from('organizations')
            .select('icebreaker_context, name')
            .eq('id', organizationId)
            .single();

        // If error (including column not existing) or no context, return empty
        if (error || !org?.icebreaker_context) {
            return null;
        }

        return org.icebreaker_context;
    } catch (error) {
        // If any error (including column not existing), just return empty
        console.warn('Could not fetch customer context:', error);
        return null;
    }
}

/**
 * Generate icebreaker using the exact proven prompt structure with DeepSeek
 */
export async function generateIcebreaker(leadData: any): Promise<string | null> {
    const firstName = leadData.first_name || '';
    const prospectInfo = buildProspectInfo(leadData);

    // Get customer context if available
    let customerContextObj: any = null;
    if (leadData.organization_id) {
        customerContextObj = await getCustomerContext(leadData.organization_id);
    }

    const customerContext = customerContextObj?.description || '';
    const exampleFormat = customerContextObj?.example_format || '{\"icebreaker\":\"Hey {name}, \\n\\n really respect X and love that you\'re doing Y. Wanted to run something by you\"}';
    const goodExamples = customerContextObj?.good_examples || [];
    const badExamples = customerContextObj?.bad_examples || [];

    // Build the customer context section
    const customerContextSection = customerContext
        ? `Here is a bunch of information about me so that you can make these icebreakers more personalised:\n\n${customerContext}`
        : '';

    // Build good examples section
    const goodExamplesSection = goodExamples.length > 0
        ? `\n\nHere are examples of GOOD icebreakers (follow this style):\n\n${goodExamples.map((ex: string, i: number) => `Example ${i + 1}:\n${ex}`).join('\n\n')}`
        : '';

    // Build bad examples section  
    const badExamplesSection = badExamples.length > 0
        ? `\n\nHere are examples of BAD icebreakers (avoid this style):\n\n${badExamples.map((ex: string, i: number) => `Bad Example ${i + 1}:\n${ex}`).join('\n\n')}`
        : '';

    // System message
    const systemMessage = 'You are a helpful, intelligent writing assistant.';

    // User message with the proven prompt structure
    const userMessage = `Your task is to take as input a bunch of personal information about a prospect, and then design a customized, one line icebreaker to begin the conversation and to imply the rest of my communique is personalised.

You'll return this icebreaker in JSON using this format:

${exampleFormat}

${customerContextSection}${goodExamplesSection}${badExamplesSection}

Rules:
- Write in a spartan, laconic tone of voice
- Weave in context with my personal information wherever possible.
- Keep things very short and follow the provided format.
- Make sure to use the above format when constructing your Icebreakers
- Shorten the company name (say, "XYZ" instead of "XYZ Tech") do so whenever possible. More examples: "Noah" instead of "Noah AI", "Plena" instead of "Plena Inc.", etc
- Start with "Hey ${firstName},"
- The icebreaker should be 2-3 sentences max
- Return ONLY valid JSON, no other text

Here is the prospect information:

${prospectInfo}`;

    try {
        const completion = await deepseek.chat.completions.create({
            model: 'deepseek-chat',
            messages: [
                { role: 'system', content: systemMessage },
                { role: 'user', content: userMessage }
            ],
            max_tokens: 200,
            temperature: 0.7,
        });

        const content = completion.choices[0]?.message?.content;
        if (content) {
            // Parse the JSON response
            const text = content.trim();

            try {
                // Try to extract JSON from the response
                const jsonMatch = text.match(/\{[\s\S]*"icebreaker"[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    if (parsed.icebreaker) {
                        // Clean up the icebreaker text
                        return parsed.icebreaker
                            .replace(/\\n/g, '\n')
                            .replace(/^[\"']|[\"']$/g, '')
                            .trim();
                    }
                }

                // Fallback: if no valid JSON, try to use the text directly
                return text.replace(/^[\"']|[\"']$/g, '').trim();
            } catch (parseError) {
                console.warn('Failed to parse JSON response, using raw text:', parseError);
                return text.replace(/^[\"']|[\"']$/g, '').trim();
            }
        }
        return null;
    } catch (error) {
        console.error('DeepSeek API Error:', error);
        throw error;
    }
}

/**
 * Generate icebreakers for multiple leads in batch
 */
export async function generateIcebreakersForLeads(
    leadIds: string[],
    organizationId?: string
): Promise<{ success: number; failed: number }> {
    const supabase = createAdminClient();
    let success = 0;
    let failed = 0;

    for (const leadId of leadIds) {
        try {
            // Get lead data
            const { data: lead, error } = await supabase
                .from('leads')
                .select('*')
                .eq('id', leadId)
                .single();

            if (error || !lead) {
                failed++;
                continue;
            }

            // Update status to generating
            await supabase
                .from('leads')
                .update({ icebreaker_status: 'generating' })
                .eq('id', leadId);

            // Generate icebreaker
            const icebreaker = await generateIcebreaker(lead);

            if (icebreaker) {
                await supabase
                    .from('leads')
                    .update({
                        icebreaker,
                        icebreaker_status: 'completed',
                        icebreaker_generated_at: new Date().toISOString(),
                    })
                    .eq('id', leadId);
                success++;
            } else {
                throw new Error('No icebreaker generated');
            }
        } catch (error) {
            console.error(`Failed to generate icebreaker for lead ${leadId}:`, error);
            await supabase
                .from('leads')
                .update({ icebreaker_status: 'failed' })
                .eq('id', leadId);
            failed++;
        }
    }

    return { success, failed };
}
