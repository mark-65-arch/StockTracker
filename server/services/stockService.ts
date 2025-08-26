import { spawn } from "child_process";

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
  }

  private async fetchFromFinnhub(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    if (!this.apiKey) {
      throw new Error('Finnhub API key not available');
    }

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

  // Fallback method using Python/yfinance
  private async validateAndGetStockWithYFinance(symbol: string, period: string = '1D'): Promise<StockInfo> {
    return new Promise((resolve, reject) => {
      const pythonScript = `
import yfinance as yf
import json
import sys
from datetime import datetime, timedelta

def get_stock_data(symbol, period):
    try:
        ticker = yf.Ticker(symbol)
        
        # Get current info
        info = ticker.info
        if not info or 'currentPrice' not in info:
            return None
            
        # Get historical data based on period
        period_map = {
            '1D': '1d',
            '1W': '5d', 
            '1M': '1mo',
            '6M': '6mo'
        }
        
        hist = ticker.history(period=period_map.get(period, '1d'))
        if hist.empty:
            return None
            
        # Calculate change
        current_price = hist['Close'].iloc[-1]
        previous_price = hist['Close'].iloc[0] if len(hist) > 1 else current_price
        change_amount = current_price - previous_price
        change_percent = (change_amount / previous_price) * 100 if previous_price != 0 else 0
        
        # Prepare chart data (limit to reasonable number of points)
        chart_data = []
        data_points = min(len(hist), 50)  # Limit to 50 points for mini chart
        step = max(1, len(hist) // data_points)
        
        for i in range(0, len(hist), step):
            chart_data.append({
                'date': hist.index[i].strftime('%Y-%m-%d %H:%M:%S'),
                'price': float(hist['Close'].iloc[i])
            })
        
        return {
            'symbol': symbol.upper(),
            'companyName': info.get('longName', info.get('shortName', symbol.upper())),
            'currentPrice': float(current_price),
            'changeAmount': float(change_amount),
            'changePercent': float(change_percent),
            'chartData': chart_data
        }
        
    except Exception as e:
        print(f"Error fetching data for {symbol}: {str(e)}", file=sys.stderr)
        return None

if __name__ == "__main__":
    symbol = sys.argv[1] if len(sys.argv) > 1 else ""
    period = sys.argv[2] if len(sys.argv) > 2 else "1D"
    
    result = get_stock_data(symbol, period)
    if result:
        print(json.dumps(result))
    else:
        sys.exit(1)
`;

      const python = spawn('python3', ['-c', pythonScript, symbol.toUpperCase(), period]);
      
      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0 && stdout.trim()) {
          try {
            const result = JSON.parse(stdout.trim());
            resolve(result);
          } catch (parseError) {
            reject(new Error(`Failed to parse stock data: ${parseError}`));
          }
        } else {
          reject(new Error(`Invalid stock symbol or data unavailable: ${symbol}`));
        }
      });

      python.on('error', (error) => {
        reject(new Error(`Failed to execute Python script: ${error.message}. Please ensure Python 3 and yfinance are installed.`));
      });
    });
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
    // Try Finnhub first if API key is available
    if (this.apiKey) {
      try {
        console.log(`Trying Finnhub API for ${symbol}...`);
        
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
          const dataPoints = Math.min(candles.c.length, 50);
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
          changeAmount = quote.d || 0;
          changePercent = quote.dp || 0;
        } else if (chartData.length > 1) {
          const firstPrice = chartData[0].price;
          const lastPrice = chartData[chartData.length - 1].price;
          changeAmount = lastPrice - firstPrice;
          changePercent = firstPrice !== 0 ? (changeAmount / firstPrice) * 100 : 0;
        }

        console.log(`Successfully fetched ${symbol} data from Finnhub`);
        return {
          symbol: symbol.toUpperCase(),
          companyName,
          currentPrice: quote.c,
          changeAmount,
          changePercent,
          chartData
        };

      } catch (finnhubError) {
        console.log(`Finnhub failed for ${symbol}, falling back to yfinance:`, finnhubError);
        // Fall back to yfinance
      }
    }

    // Fallback to yfinance
    console.log(`Using yfinance fallback for ${symbol}...`);
    try {
      return await this.validateAndGetStockWithYFinance(symbol, period);
    } catch (error) {
      console.error(`Both Finnhub and yfinance failed for ${symbol}:`, error);
      throw new Error(`Failed to fetch stock data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchStocks(query: string): Promise<{ symbol: string; name: string; price?: number }[]> {
    if (!this.apiKey) {
      return [];
    }

    try {
      const results = await this.fetchFromFinnhub('/search', { q: query });
      
      if (!results.result || !Array.isArray(results.result)) {
        return [];
      }

      return results.result
        .slice(0, 10)
        .map((item: any) => ({
          symbol: item.symbol,
          name: item.description || item.symbol,
          price: undefined
        }));
    } catch (error) {
      console.error('Error searching stocks:', error);
      return [];
    }
  }
}

export const stockService = new StockService();