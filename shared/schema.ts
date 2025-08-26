import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const stocks = pgTable("stocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  symbol: text("symbol").notNull().unique(),
  companyName: text("company_name").notNull(),
  currentPrice: real("current_price").notNull(),
  changeAmount: real("change_amount").notNull(),
  changePercent: real("change_percent").notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

export const stockData = pgTable("stock_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stockId: varchar("stock_id").notNull().references(() => stocks.id, { onDelete: 'cascade' }),
  date: timestamp("date").notNull(),
  price: real("price").notNull(),
  period: text("period").notNull(), // '1D', '1W', '1M', '6M'
});

export const insertStockSchema = createInsertSchema(stocks).pick({
  symbol: true,
});

export const insertStockDataSchema = createInsertSchema(stockData).pick({
  stockId: true,
  date: true,
  price: true,
  period: true,
});

export type Stock = typeof stocks.$inferSelect;
export type InsertStock = z.infer<typeof insertStockSchema>;
export type StockData = typeof stockData.$inferSelect;
export type InsertStockData = z.infer<typeof insertStockDataSchema>;

// API response types
export type StockWithData = Stock & {
  chartData: { date: string; price: number }[];
  trend: 'positive' | 'negative';
};

export type WatchlistStats = {
  totalStocks: number;
  gainers: number;
  losers: number;
};
