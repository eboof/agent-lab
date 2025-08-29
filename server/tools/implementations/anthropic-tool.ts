// Anthropic Tool Implementation  
// Provides Claude AI-powered analysis and reasoning for agents

import Anthropic from '@anthropic-ai/sdk';

export class AnthropicTool {
  private static client: Anthropic | null = null;

  /**
   * Initialize Anthropic client with API key
   */
  private static getClient(apiKey: string): Anthropic {
    if (!this.client) {
      this.client = new Anthropic({ apiKey });
    }
    return this.client;
  }

  /**
   * Generate Claude analysis of stock data with reasoning
   */
  static async analyzeStockData(apiKey: string, stockData: any, systemPrompt: string) {
    const client = this.getClient(apiKey);
    
    const prompt = `${systemPrompt}

I need a detailed stock analysis with clear reasoning:

Stock Data:
- Symbol: ${stockData.quote?.symbol}
- Current Price: $${stockData.quote?.currentPrice}
- Price Change: ${stockData.quote?.priceChangePercent?.toFixed(2)}%
- Market Cap: $${stockData.quote?.marketCap?.toLocaleString()}
- Volume vs Average: ${stockData.analysis?.volumeAnalysis}
- 52-week Position: ${stockData.analysis?.pricePosition}
- Technical Trend: ${stockData.technicalIndicators?.trend}
- Volatility: ${stockData.technicalIndicators?.volatility?.toFixed(2)}
- Calculated Risk: ${stockData.analysis?.riskLevel}

Please provide:
1. **Market Context**: What does this data tell us about current market conditions?
2. **Technical Analysis**: Interpretation of price action and indicators
3. **Risk Assessment**: Detailed risk factors and mitigation strategies  
4. **Reasoning Process**: Step-by-step logic for your conclusions
5. **Actionable Recommendation**: Clear buy/hold/sell with confidence level
6. **Key Monitoring Points**: What metrics to watch going forward

Use clear reasoning and cite specific data points from the analysis.`;

    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [
          { 
            role: 'user', 
            content: prompt 
          }
        ]
      });

      const content = response.content[0];
      return {
        analysis: content.type === 'text' ? content.text : 'No analysis generated',
        model: 'claude-sonnet-4-20250514',
        tokens: response.usage?.input_tokens + response.usage?.output_tokens || 0,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      throw new Error(`Claude analysis failed: ${error.message}`);
    }
  }

  /**
   * Generate reasoned response with step-by-step thinking
   */
  static async generateReasonedResponse(apiKey: string, prompt: string, systemPrompt: string, options: {
    model?: string;
    maxTokens?: number;
    reasoning?: boolean;
  } = {}) {
    const client = this.getClient(apiKey);
    
    const enhancedPrompt = options.reasoning ? 
      `${prompt}\n\nPlease think through this step-by-step and show your reasoning process.` : 
      prompt;
    
    try {
      const response = await client.messages.create({
        model: options.model || 'claude-sonnet-4-20250514',
        max_tokens: options.maxTokens || 1000,
        system: systemPrompt,
        messages: [
          { role: 'user', content: enhancedPrompt }
        ]
      });

      const content = response.content[0];
      return {
        response: content.type === 'text' ? content.text : 'No response generated',
        model: options.model || 'claude-sonnet-4-20250514',
        tokens: response.usage?.input_tokens + response.usage?.output_tokens || 0,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      throw new Error(`Claude request failed: ${error.message}`);
    }
  }

  /**
   * Analyze complex financial scenarios with multi-step reasoning
   */
  static async analyzeFinancialScenario(apiKey: string, scenario: {
    question: string;
    context: any;
    constraints?: string[];
    goals?: string[];
  }) {
    const client = this.getClient(apiKey);
    
    const prompt = `I need help analyzing this financial scenario:

**Question:** ${scenario.question}

**Context/Data:**
${JSON.stringify(scenario.context, null, 2)}

${scenario.constraints ? `**Constraints:**\n${scenario.constraints.map(c => `- ${c}`).join('\n')}\n` : ''}

${scenario.goals ? `**Goals:**\n${scenario.goals.map(g => `- ${g}`).join('\n')}\n` : ''}

Please provide:
1. **Situation Analysis**: What are the key factors at play?
2. **Reasoning Process**: Walk through your thinking step-by-step
3. **Risk vs Opportunity**: Balanced assessment of potential outcomes
4. **Decision Framework**: How should someone approach this decision?
5. **Specific Recommendations**: Concrete next steps
6. **Contingency Planning**: What if scenarios and backup plans

Think carefully and show your reasoning at each step.`;

    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: 'You are a thoughtful financial advisor who thinks through problems step-by-step and provides clear reasoning.',
        messages: [
          { role: 'user', content: prompt }
        ]
      });

      const content = response.content[0];
      return {
        analysis: content.type === 'text' ? content.text : 'No analysis generated',
        scenario: scenario.question,
        model: 'claude-sonnet-4-20250514',
        tokens: response.usage?.input_tokens + response.usage?.output_tokens || 0,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      throw new Error(`Financial scenario analysis failed: ${error.message}`);
    }
  }

  /**
   * Generate investment strategy with detailed reasoning
   */
  static async createInvestmentStrategy(apiKey: string, profile: {
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    timeHorizon: 'short' | 'medium' | 'long';
    goals: string[];
    currentPositions?: any[];
    marketView?: string;
  }) {
    const client = this.getClient(apiKey);
    
    const prompt = `Help me create a personalized investment strategy:

**Investor Profile:**
- Risk Tolerance: ${profile.riskTolerance}
- Time Horizon: ${profile.timeHorizon}
- Goals: ${profile.goals.join(', ')}
${profile.marketView ? `- Market View: ${profile.marketView}` : ''}

${profile.currentPositions ? `**Current Positions:**
${JSON.stringify(profile.currentPositions, null, 2)}` : ''}

Please provide a comprehensive strategy including:

1. **Strategic Analysis**: How these factors should influence investment approach
2. **Asset Allocation**: Recommended portfolio structure with rationale
3. **Risk Management**: Specific risk mitigation strategies
4. **Implementation Plan**: Step-by-step execution approach
5. **Monitoring Framework**: Key metrics and review schedules
6. **Adjustment Triggers**: When and why to modify the strategy

Think through each recommendation carefully and explain your reasoning.`;

    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2500,
        system: 'You are a sophisticated investment strategist who creates personalized, well-reasoned investment plans.',
        messages: [
          { role: 'user', content: prompt }
        ]
      });

      const content = response.content[0];
      return {
        strategy: content.type === 'text' ? content.text : 'No strategy generated',
        profile,
        model: 'claude-sonnet-4-20250514',
        tokens: response.usage?.input_tokens + response.usage?.output_tokens || 0,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      throw new Error(`Investment strategy creation failed: ${error.message}`);
    }
  }
}