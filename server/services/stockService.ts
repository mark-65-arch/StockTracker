export interface StockInfo {
  symbol: string;
  companyName: string;
  currentPrice: number;
  changeAmount: number;
  changePercent: number;
  chartData: { date: string; price: number }[];
}

export class StockService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://finnhub.io/api/v1';

  constructor() {
    this.apiKey = process.env.FINNHUB_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('FINNHUB_API_KEY environment variable is required');
    }
  }

  private async fetchFromFinnhub(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.append('token', this.apiKey);
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  private getResolution(period: string): string {
    switch (period) {
      case '1D': return '1';
      case '1W': return '5';
      case '1M': return 'D';
      case '6M': return 'D';
      default: return '1';
    }
  }

  private getTimestamps(period: string): { from: number; to: number } {
    const now = Math.floor(Date.now() / 1000);
    const oneDay = 24 * 60 * 60;
    
    switch (period) {
      case '1D':
        return { from: now - oneDay, to: now };
      case '1W':
        return { from: now - (7 * oneDay), to: now };
      case '1M':
        return { from: now - (30 * oneDay), to: now };
      case '6M':
        return { from: now - (180 * oneDay), to: now };
      default:
        return { from: now - oneDay, to: now };
    }
  }

  async validateAndGetStock(symbol: string, period: string = '1D'): Promise<StockInfo> {
    try {
      // Get current quote
      const quote = await this.fetchFromFinnhub('/quote', { symbol: symbol.toUpperCase() });
      
      if (!quote.c || quote.c === 0) {
        throw new Error(`Invalid stock symbol or no data available for ${symbol}`);
      }

      // Get company profile for name
      const profile = await this.fetchFromFinnhub('/stock/profile2', { symbol: symbol.toUpperCase() });
      const companyName = profile.name || symbol.toUpperCase();

      // Get historical data for chart
      const { from, to } = this.getTimestamps(period);
      const resolution = this.getResolution(period);
      
      const candles = await this.fetchFromFinnhub('/stock/candle', {
        symbol: symbol.toUpperCase(),
        resolution,
        from: from.toString(),
        to: to.toString()
      });

      // Process chart data
      let chartData: { date: string; price: number }[] = [];
      if (candles.c && candles.t && candles.c.length > 0) {
        const dataPoints = Math.min(candles.c.length, 50); // Limit to 50 points
        const step = Math.max(1, Math.floor(candles.c.length / dataPoints));
        
        for (let i = 0; i < candles.c.length; i += step) {
          chartData.push({
            date: new Date(candles.t[i] * 1000).toISOString(),
            price: candles.c[i]
          });
        }
      }

      // Calculate change based on period
      let changeAmount = 0;
      let changePercent = 0;
      
      if (period === '1D') {
        // Use daily change from quote
        changeAmount = quote.d || 0;
        changePercent = quote.dp || 0;
      } else if (chartData.length > 1) {
        // Calculate change from first to last price in chart data
        const firstPrice = chartData[0].price;
        const lastPrice = chartData[chartData.length - 1].price;
        changeAmount = lastPrice - firstPrice;
        changePercent = firstPrice !== 0 ? (changeAmount / firstPrice) * 100 : 0;
      }

      return {
        symbol: symbol.toUpperCase(),
        companyName,
        currentPrice: quote.c,
        changeAmount,
        changePercent,
        chartData
      };

    } catch (error) {
      console.error(`Error fetching stock data for ${symbol}:`, error);
      throw new Error(`Failed to fetch stock data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchStocks(query: string): Promise<{ symbol: string; name: string; price?: number }[]> {
    try {
      const results = await this.fetchFromFinnhub('/search', { q: query });
      
      if (!results.result || !Array.isArray(results.result)) {
        return [];
      }

      return results.result
        .slice(0, 10) // Limit to 10 results
        .map((item: any) => ({
          symbol: item.symbol,
          name: item.description || item.symbol,
          price: undefined // We don't get price from search endpoint
        }));
    } catch (error) {
      console.error('Error searching stocks:', error);
      return [];
    }
  }
}

export const stockService = new StockService();