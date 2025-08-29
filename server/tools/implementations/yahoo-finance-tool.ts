// Yahoo Finance Tool Implementation
// Provides real stock data integration for agents

import yahooFinance from 'yahoo-finance2';

export class YahooFinanceTool {
  /**
   * Get current stock quote data
   */
  static async getQuote(symbol: string) {
    try {
      const quote = await yahooFinance.quote(symbol);
      return {
        symbol: quote.symbol,
        currentPrice: quote.regularMarketPrice,
        previousClose: quote.regularMarketPreviousClose,
        priceChange: quote.regularMarketChange,
        priceChangePercent: quote.regularMarketChangePercent,
        marketCap: quote.marketCap,
        volume: quote.regularMarketVolume,
        high52Week: quote.fiftyTwoWeekHigh,
        low52Week: quote.fiftyTwoWeekLow,
        dayHigh: quote.regularMarketDayHigh,
        dayLow: quote.regularMarketDayLow,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      throw new Error(`Failed to get quote for ${symbol}: ${error.message}`);
    }
  }

  /**
   * Get historical price data
   */
  static async getHistorical(symbol: string, period: string = '1mo') {
    try {
      const historical = await yahooFinance.historical(symbol, {
        period1: this.getPeriodStartDate(period),
        period2: new Date(),
        interval: '1d'
      });
      
      return {
        symbol,
        period,
        data: historical.map(day => ({
          date: day.date.toISOString().split('T')[0],
          open: day.open,
          high: day.high,
          low: day.low,
          close: day.close,
          volume: day.volume
        })),
        count: historical.length,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      throw new Error(`Failed to get historical data for ${symbol}: ${error.message}`);
    }
  }

  /**
   * Get comprehensive stock analysis data
   */
  static async getStockAnalysis(symbol: string, period: string = '1mo') {
    const [quote, historical] = await Promise.all([
      this.getQuote(symbol),
      this.getHistorical(symbol, period)
    ]);

    // Calculate basic technical indicators
    const prices = historical.data.map(d => d.close);
    const sma20 = this.calculateSMA(prices, 20);
    const volatility = this.calculateVolatility(prices);

    return {
      quote,
      historical,
      technicalIndicators: {
        sma20: sma20[sma20.length - 1],
        volatility,
        trend: prices[prices.length - 1] > sma20[sma20.length - 1] ? 'bullish' : 'bearish'
      },
      analysis: {
        pricePosition: this.analyzePricePosition(quote),
        volumeAnalysis: this.analyzeVolume(quote),
        riskLevel: this.assessRiskLevel(volatility, quote.priceChangePercent || 0)
      },
      timestamp: new Date().toISOString()
    };
  }

  // Helper methods
  private static getPeriodStartDate(period: string): Date {
    const now = new Date();
    switch (period) {
      case '1d': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '5d': return new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
      case '1mo': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '3mo': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '1y': return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default: return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  private static calculateSMA(prices: number[], period: number): number[] {
    const sma = [];
    for (let i = period - 1; i < prices.length; i++) {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
    return sma;
  }

  private static calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((acc, ret) => acc + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    return Math.sqrt(variance) * Math.sqrt(252); // Annualized volatility
  }

  private static analyzePricePosition(quote: any): string {
    const { currentPrice, high52Week, low52Week } = quote;
    const position = (currentPrice - low52Week) / (high52Week - low52Week);
    
    if (position > 0.8) return 'near_52_week_high';
    if (position < 0.2) return 'near_52_week_low';
    return 'mid_range';
  }

  private static analyzeVolume(quote: any): string {
    const { volume, averageVolume } = quote;
    if (!averageVolume) return 'unknown';
    
    const volumeRatio = volume / averageVolume;
    if (volumeRatio > 1.5) return 'high_volume';
    if (volumeRatio < 0.5) return 'low_volume';
    return 'normal_volume';
  }

  private static assessRiskLevel(volatility: number, priceChangePercent: number): string {
    if (volatility > 0.4 || Math.abs(priceChangePercent) > 10) return 'high';
    if (volatility > 0.2 || Math.abs(priceChangePercent) > 5) return 'medium';
    return 'low';
  }
}