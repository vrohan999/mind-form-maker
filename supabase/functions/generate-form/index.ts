import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description } = await req.json();
    console.log('Generating form from description:', description);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a form generation AI. Your task is to analyze natural language descriptions of forms and generate structured form schemas.

CRITICAL RULES:
1. Detect contradictions (e.g., "anonymous form with phone number")
2. If contradictions exist, return a clarification request
3. Generate appropriate field types: text, email, tel, number, select, textarea
4. Include validation rules for each field
5. Return ONLY valid JSON, no markdown, no explanation

Response format for valid forms:
{
  "type": "form",
  "title": "Form Title",
  "description": "Brief description",
  "fields": [
    {
      "id": "unique_id",
      "label": "Field Label",
      "type": "text|email|tel|number|select|textarea",
      "placeholder": "Placeholder text",
      "required": true|false,
      "validation": {
        "pattern": "regex pattern (optional)",
        "message": "validation error message"
      },
      "options": ["option1", "option2"] // only for select type
    }
  ]
}

Response format for contradictions:
{
  "type": "clarification",
  "contradiction": "Description of the contradiction",
  "questions": [
    "Question 1?",
    "Question 2?"
  ]
}`
          },
          {
            role: 'user',
            content: description
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_form_schema',
              description: 'Generate a structured form schema or request clarification for contradictions',
              parameters: {
                type: 'object',
                properties: {
                  type: {
                    type: 'string',
                    enum: ['form', 'clarification']
                  },
                  title: { type: 'string' },
                  description: { type: 'string' },
                  fields: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        label: { type: 'string' },
                        type: { 
                          type: 'string',
                          enum: ['text', 'email', 'tel', 'number', 'select', 'textarea']
                        },
                        placeholder: { type: 'string' },
                        required: { type: 'boolean' },
                        validation: {
                          type: 'object',
                          properties: {
                            pattern: { type: 'string' },
                            message: { type: 'string' }
                          }
                        },
                        options: {
                          type: 'array',
                          items: { type: 'string' }
                        }
                      },
                      required: ['id', 'label', 'type', 'required']
                    }
                  },
                  contradiction: { type: 'string' },
                  questions: {
                    type: 'array',
                    items: { type: 'string' }
                  }
                },
                required: ['type']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'generate_form_schema' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service requires additional credits. Please contact support.' }), 
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data));

    const toolCall = data.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const formSchema = JSON.parse(toolCall.function.arguments);
    console.log('Generated form schema:', JSON.stringify(formSchema));

    return new Response(
      JSON.stringify(formSchema),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-form function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});