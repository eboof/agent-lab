// OpenAI Tool Implementation
// Provides AI-powered analysis and text generation for agents

import OpenAI from 'openai';

export class OpenAITool {
  private static client: OpenAI | null = null;

  /**
   * Initialize OpenAI client with API key
   */
  private static getClient(apiKey: string): OpenAI {
    if (!this.client) {
      this.client = new OpenAI({ apiKey });
    }
    return this.client;
  }

  /**
   * Generate AI analysis of stock data
   */
  static async analyzeStockData(apiKey: string, stockData: any, systemPrompt: string) {
    const client = this.getClient(apiKey);
    
    const prompt = `${systemPrompt}

Stock Analysis Request:
- Symbol: ${stockData.quote?.symbol}
- Current Price: $${stockData.quote?.currentPrice}
- Price Change: ${stockData.quote?.priceChangePercent?.toFixed(2)}%
- Technical Trend: ${stockData.technicalIndicators?.trend}
- Volatility: ${stockData.technicalIndicators?.volatility?.toFixed(2)}
- Risk Level: ${stockData.analysis?.riskLevel}
- Price Position: ${stockData.analysis?.pricePosition}

Please provide a comprehensive analysis including:
1. Market sentiment interpretation
2. Technical analysis insights  
3. Risk assessment
4. Investment recommendation (Buy/Hold/Sell)
5. Key factors to monitor

Format your response as professional investment analysis.`;

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are an expert financial analyst providing investment insights.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.3
      });

      return {
        analysis: response.choices[0]?.message?.content || 'No analysis generated',
        model: 'gpt-4o',
        tokens: response.usage?.total_tokens || 0,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      throw new Error(`OpenAI analysis failed: ${error.message}`);
    }
  }

  /**
   * Generate general AI response
   */
  static async generateResponse(apiKey: string, prompt: string, systemPrompt: string, options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  } = {}) {
    const client = this.getClient(apiKey);
    
    try {
      const response = await client.chat.completions.create({
        model: options.model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: options.maxTokens || 500,
        temperature: options.temperature || 0.7
      });

      return {
        response: response.choices[0]?.message?.content || 'No response generated',
        model: options.model || 'gpt-4o-mini',
        tokens: response.usage?.total_tokens || 0,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      throw new Error(`OpenAI request failed: ${error.message}`);
    }
  }

  /**
   * Analyze and categorize user input
   */
  static async analyzeUserIntent(apiKey: string, userInput: string) {
    const client = this.getClient(apiKey);
    
    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'Analyze user input and categorize the intent. Respond with JSON format: {"intent": "stock_analysis|general_query|data_request", "entities": ["extracted", "entities"], "confidence": 0.95}' 
          },
          { role: 'user', content: userInput }
        ],
        max_tokens: 150,
        temperature: 0.1
      });

      const content = response.choices[0]?.message?.content || '{}';
      return {
        ...JSON.parse(content),
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      // Fallback intent analysis
      return {
        intent: userInput.toLowerCase().includes('stock') ? 'stock_analysis' : 'general_query',
        entities: this.extractStockSymbols(userInput),
        confidence: 0.5,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Generate investment recommendation
   */
  static async generateRecommendation(apiKey: string, analysis: any, riskTolerance: string = 'medium') {
    const client = this.getClient(apiKey);
    
    const prompt = `Based on this stock analysis, provide a specific investment recommendation:

Analysis Data:
${JSON.stringify(analysis, null, 2)}

Risk Tolerance: ${riskTolerance}

Provide a clear recommendation in this format:
- Recommendation: [BUY/HOLD/SELL]
- Confidence: [High/Medium/Low]
- Price Target: $[amount] (if applicable)
- Risk Assessment: [Low/Medium/High]
- Time Horizon: [Short/Medium/Long term]
- Key Reasons: [bullet points]

Keep it concise and actionable.`;

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a professional investment advisor. Provide clear, actionable recommendations.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 400,
        temperature: 0.2
      });

      return {
        recommendation: response.choices[0]?.message?.content || 'No recommendation generated',
        riskTolerance,
        model: 'gpt-4o',
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      throw new Error(`Recommendation generation failed: ${error.message}`);
    }
  }

  // Helper methods
  private static extractStockSymbols(text: string): string[] {
    const stockRegex = /\b[A-Z]{1,5}\b/g;
    const matches = text.match(stockRegex) || [];
    
    // Filter out common words that aren't stock symbols
    const commonWords = ['THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER', 'WAS', 'ONE', 'OUR', 'OUT', 'DAY', 'GET', 'USE', 'MAN', 'NEW', 'NOW', 'WAY', 'MAY', 'SAY'];
    return matches.filter(word => !commonWords.includes(word));
  }
}