import { type Stock, type InsertStock, type StockData, type InsertStockData, type WatchlistStats } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Stock operations
  getStocks(): Promise<Stock[]>;
  getStock(id: string): Promise<Stock | undefined>;
  getStockBySymbol(symbol: string): Promise<Stock | undefined>;
  createStock(stock: InsertStock & { companyName: string; currentPrice: number; changeAmount: number; changePercent: number }): Promise<Stock>;
  updateStock(id: string, updates: Partial<Stock>): Promise<Stock | undefined>;
  deleteStock(id: string): Promise<boolean>;
  
  // Stock data operations
  getStockData(stockId: string, period: string): Promise<StockData[]>;
  createStockData(data: InsertStockData): Promise<StockData>;
  deleteStockData(stockId: string): Promise<boolean>;
  
  // Stats
  getWatchlistStats(): Promise<WatchlistStats>;
}

export class MemStorage implements IStorage {
  private stocks: Map<string, Stock>;
  private stockData: Map<string, StockData>;

  constructor() {
    this.stocks = new Map();
    this.stockData = new Map();
  }

  async getStocks(): Promise<Stock[]> {
    return Array.from(this.stocks.values()).sort((a, b) => 
      new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
    );
  }

  async getStock(id: string): Promise<Stock | undefined> {
    return this.stocks.get(id);
  }

  async getStockBySymbol(symbol: string): Promise<Stock | undefined> {
    return Array.from(this.stocks.values()).find(
      (stock) => stock.symbol.toLowerCase() === symbol.toLowerCase()
    );
  }

  async createStock(insertStock: InsertStock & { companyName: string; currentPrice: number; changeAmount: number; changePercent: number }): Promise<Stock> {
    const id = randomUUID();
    const stock: Stock = {
      id,
      symbol: insertStock.symbol.toUpperCase(),
      companyName: insertStock.companyName,
      currentPrice: insertStock.currentPrice,
      changeAmount: insertStock.changeAmount,
      changePercent: insertStock.changePercent,
      addedAt: new Date(),
    };
    this.stocks.set(id, stock);
    return stock;
  }

  async updateStock(id: string, updates: Partial<Stock>): Promise<Stock | undefined> {
    const existingStock = this.stocks.get(id);
    if (!existingStock) return undefined;
    
    const updatedStock = { ...existingStock, ...updates };
    this.stocks.set(id, updatedStock);
    return updatedStock;
  }

  async deleteStock(id: string): Promise<boolean> {
    const deleted = this.stocks.delete(id);
    // Also delete related stock data
    Array.from(this.stockData.entries()).forEach(([dataId, data]) => {
      if (data.stockId === id) {
        this.stockData.delete(dataId);
      }
    });
    return deleted;
  }

  async getStockData(stockId: string, period: string): Promise<StockData[]> {
    return Array.from(this.stockData.values())
      .filter(data => data.stockId === stockId && data.period === period)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async createStockData(insertData: InsertStockData): Promise<StockData> {
    const id = randomUUID();
    const data: StockData = {
      id,
      stockId: insertData.stockId,
      date: insertData.date,
      price: insertData.price,
      period: insertData.period,
    };
    this.stockData.set(id, data);
    return data;
  }

  async deleteStockData(stockId: string): Promise<boolean> {
    let deleted = false;
    Array.from(this.stockData.entries()).forEach(([dataId, data]) => {
      if (data.stockId === stockId) {
        this.stockData.delete(dataId);
        deleted = true;
      }
    });
    return deleted;
  }

  async getWatchlistStats(): Promise<WatchlistStats> {
    const stocks = Array.from(this.stocks.values());
    const totalStocks = stocks.length;
    const gainers = stocks.filter(stock => stock.changePercent > 0).length;
    const losers = stocks.filter(stock => stock.changePercent < 0).length;
    
    return {
      totalStocks,
      gainers,
      losers,
    };
  }
}

export const storage = new MemStorage();
