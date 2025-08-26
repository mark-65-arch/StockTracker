import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { stockService } from "./services/stockService";
import { insertStockSchema } from "@shared/schema";
import { z } from "zod";

const periodSchema = z.enum(['1D', '1W', '1M', '6M']);

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all stocks in watchlist
  app.get("/api/stocks", async (req, res) => {
    try {
      const period = req.query.period as string || '1D';
      const validatedPeriod = periodSchema.parse(period);
      
      const stocks = await storage.getStocks();
      const stocksWithData = await Promise.all(
        stocks.map(async (stock) => {
          try {
            // Get fresh data for the current period
            const freshData = await stockService.validateAndGetStock(stock.symbol, validatedPeriod);
            
            // Update stock with fresh data
            await storage.updateStock(stock.id, {
              currentPrice: freshData.currentPrice,
              changeAmount: freshData.changeAmount,
              changePercent: freshData.changePercent,
            });

            return {
              ...stock,
              currentPrice: freshData.currentPrice,
              changeAmount: freshData.changeAmount,
              changePercent: freshData.changePercent,
              chartData: freshData.chartData,
              trend: freshData.changePercent >= 0 ? 'positive' : 'negative' as const,
            };
          } catch (error) {
            // Return stock with existing data if fresh fetch fails
            return {
              ...stock,
              chartData: [],
              trend: stock.changePercent >= 0 ? 'positive' : 'negative' as const,
            };
          }
        })
      );

      res.json(stocksWithData);
    } catch (error) {
      console.error("Error fetching stocks:", error);
      res.status(500).json({ message: "Failed to fetch stocks" });
    }
  });

  // Add stock to watchlist
  app.post("/api/stocks", async (req, res) => {
    try {
      const { symbol } = insertStockSchema.parse(req.body);
      
      // Check if stock already exists
      const existingStock = await storage.getStockBySymbol(symbol);
      if (existingStock) {
        return res.status(409).json({ message: "Stock already in watchlist" });
      }

      // Validate and get stock data
      const stockData = await stockService.validateAndGetStock(symbol);
      
      // Add to storage
      const newStock = await storage.createStock({
        symbol: stockData.symbol,
        companyName: stockData.companyName,
        currentPrice: stockData.currentPrice,
        changeAmount: stockData.changeAmount,
        changePercent: stockData.changePercent,
      });

      res.status(201).json({
        ...newStock,
        chartData: stockData.chartData,
        trend: stockData.changePercent >= 0 ? 'positive' : 'negative',
      });
    } catch (error) {
      console.error("Error adding stock:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid stock symbol format" });
      }
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to add stock"
      });
    }
  });

  // Remove stock from watchlist
  app.delete("/api/stocks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteStock(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Stock not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error removing stock:", error);
      res.status(500).json({ message: "Failed to remove stock" });
    }
  });

  // Get watchlist statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getWatchlistStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Validate stock symbol
  app.get("/api/validate/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const stockData = await stockService.validateAndGetStock(symbol);
      res.json({ 
        valid: true, 
        symbol: stockData.symbol,
        companyName: stockData.companyName,
        currentPrice: stockData.currentPrice 
      });
    } catch (error) {
      res.status(400).json({ 
        valid: false, 
        message: error instanceof Error ? error.message : "Invalid stock symbol"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
