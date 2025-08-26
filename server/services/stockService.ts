import { spawn } from "child_process";
import path from "path";

export interface StockInfo {
  symbol: string;
  companyName: string;
  currentPrice: number;
  changeAmount: number;
  changePercent: number;
  chartData: { date: string; price: number }[];
}

export class StockService {
  async validateAndGetStock(symbol: string, period: string = '1D'): Promise<StockInfo> {
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

      // Write Python script to temporary file and execute
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

  async searchStocks(query: string): Promise<{ symbol: string; name: string; price?: number }[]> {
    // For simplicity, return empty array - in production this would use a search API
    return [];
  }
}

export const stockService = new StockService();
