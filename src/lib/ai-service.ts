/**
 * AI Service - Provides AI capabilities via OpenRouter (free tier available)
 * Falls back to simpler local processing if no API key is configured
 */

export interface AIResponse {
  success: boolean;
  content?: string;
  error?: string;
  model?: string;
}

interface AIConfig {
  apiKey: string;
  model: string;
}

class AIService {
  private config: AIConfig | null = null;

  /**
   * Initialize AI service with configuration
   */
  initialize(config: AIConfig): void {
    this.config = config;
  }

  /**
   * Check if AI service is available
   */
  isConfigured(): boolean {
    return !!this.config?.apiKey && this.config.apiKey !== 'YOUR_OPENROUTER_API_KEY_HERE';
  }

  /**
   * Get AI status
   */
  getStatus(): { configured: boolean; model: string } {
    return {
      configured: this.isConfigured(),
      model: this.config?.model || 'llama-3.1-8b-instruct'
    };
  }

  /**
   * Generate content using OpenRouter API
   */
  async generateContent(prompt: string, systemPrompt?: string): Promise<AIResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'AI não configurado. Adicione uma API Key do OpenRouter nas configurações.'
      };
    }

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config!.apiKey}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'NuRa Flow'
        },
        body: JSON.stringify({
          model: this.config!.model,
          messages: systemPrompt
            ? [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }]
            : [{ role: 'user', content: prompt }],
          max_tokens: 2000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content || '';

      return {
        success: true,
        content,
        model: this.config!.model
      };
    } catch (error) {
      console.error('AI generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao gerar conteúdo'
      };
    }
  }

  /**
   * Summarize meeting notes
   */
  async summarizeMeeting(meetingData: {
    title?: string;
    date?: string;
    participants?: string[];
    agenda?: string;
    notes?: string;
    actionItems?: string[];
  }): Promise<AIResponse> {
    const { title, date, participants, agenda, notes, actionItems } = meetingData;

    const systemPrompt = `Você é um assistente de produtividade profissional. Sua tarefa é resumir reuniões de forma clara e concisa. Responda em português do Brasil.`;

    const prompt = `Resuma esta reunião:

**Título:** ${title || 'Reunião sem título'}
**Data:** ${date || 'Data não informada'}
**Participantes:** ${participants?.join(', ') || 'Não informados'}
**Pauta:** ${agenda || 'Não definida'}
**Notas:** ${notes || 'Nenhuma nota registrada'}
**Itens de ação:** ${actionItems?.join(', ') || 'Nenhum'}

Forneça:
1. Resumo executivo (2-3 frases)
2. Principais decisões tomadas
3. Próximos passos/action items
4. Dúvidas pendentes (se houver)`;

    return this.generateContent(prompt, systemPrompt);
  }

  /**
   * Generate briefing for the day
   */
  async generateDailyBriefing(
    tasks: Array<{ title: string; dueDate?: string; priority: string; status: string }>,
    meetings: Array<{ title: string; date: string; startTime: string }>,
    notes?: string
  ): Promise<AIResponse> {
    const systemPrompt = `Você é um assistente de produtividade. Crie um briefing diário motivacional e organizado em português do Brasil. Seja encorajador mas prático.`;

    const urgentTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'done').slice(0, 5);
    const todayMeetings = meetings.filter(m => m.date === new Date().toISOString().split('T')[0]).slice(0, 3);

    const prompt = `Crie um briefing diário com base nos seguintes dados:

**Tarefas urgentes:**
${urgentTasks.map(t => `- ${t.title} (Vencimento: ${t.dueDate || 'Não definido'})`).join('\n') || 'Nenhuma tarefa urgente'}

**Reuniões de hoje:**
${todayMeetings.map(m => `- ${m.title} às ${m.startTime}`).join('\n') || 'Nenhuma reunião agendada'}

${notes ? `**Notas anteriores:**\n${notes}\n` : ''}

Formato desejado:
- Saudação motivacional
- Resumo do dia
- Prioridades
- Dica de produtividade`;

    return this.generateContent(prompt, systemPrompt);
  }

  /**
   * Transcribe audio (placeholder - would need Whisper API or local model)
   */
  async transcribeAudio(_audioBase64: string, _mimeType: string): Promise<AIResponse> {
    // For now, return a placeholder response
    // In production, this would use Whisper API or similar
    return {
      success: false,
      error: 'Transcrição de áudio requer configuração adicional. Use o OpenAI Whisper API ou implemente integração com serviço de transcrição.'
    };
  }

  /**
   * Chat with AI assistant
   */
  async chat(message: string, context?: string): Promise<AIResponse> {
    const systemPrompt = context
      ? `Você é um assistente de produtividade chamado NuRa. Use o contexto abaixo para responder de forma útil:\n\n${context}\n\nAgora responda à mensagem do usuário.`
      : 'Você é um assistente de produtividade chamado NuRa. Ajudi o usuário a organizar tarefas, reuniões e ideias. Responda de forma útil e concisa em português do Brasil.';

    return this.generateContent(message, systemPrompt);
  }
}

export const AIServiceInstance = new AIService();
export default AIServiceInstance;
