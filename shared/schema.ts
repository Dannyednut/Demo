import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  walletAddress: text("wallet_address"),
});

export const nfts = pgTable("nfts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  ownerAddress: text("owner_address").notNull(),
  mintPrice: real("mint_price").notNull(),
  currentSentiment: real("current_sentiment").notNull().default(0.5),
  rarityTier: text("rarity_tier").default("common"), // common, rare, ultra_rare, legendary
  attributes: jsonb("attributes").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sentimentData = pgTable("sentiment_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timestamp: timestamp("timestamp").defaultNow(),
  marketSentiment: real("market_sentiment").notNull(),
  btcPrice: real("btc_price"),
  ethPrice: real("eth_price"),
  solPrice: real("sol_price"),
  volume24h: real("volume_24h"),
  activeTraders: integer("active_traders"),
  nftsMinted: integer("nfts_minted"),
});

export const marketActivity = pgTable("market_activity", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  action: text("action").notNull(), // "minted", "sold", "transferred", "listed", "bid_placed"
  nftId: varchar("nft_id"),
  nftName: text("nft_name").notNull(),
  price: real("price"),
  fromAddress: text("from_address"),
  toAddress: text("to_address"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const collections = pgTable("collections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  volume: real("volume").notNull().default(0),
  floorPrice: real("floor_price"),
  totalItems: integer("total_items").default(0),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertNftSchema = createInsertSchema(nfts).omit({
  id: true,
  createdAt: true,
  mintPrice: true,
  currentSentiment: true,
  rarityTier: true,
});

export const insertSentimentDataSchema = createInsertSchema(sentimentData).omit({
  id: true,
  timestamp: true,
});

export const insertMarketActivitySchema = createInsertSchema(marketActivity).omit({
  id: true,
  timestamp: true,
});

export const insertCollectionSchema = createInsertSchema(collections).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertNft = z.infer<typeof insertNftSchema>;
export type Nft = typeof nfts.$inferSelect;

export type InsertSentimentData = z.infer<typeof insertSentimentDataSchema>;
export type SentimentData = typeof sentimentData.$inferSelect;

export type InsertMarketActivity = z.infer<typeof insertMarketActivitySchema>;
export type MarketActivity = typeof marketActivity.$inferSelect;

export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type Collection = typeof collections.$inferSelect;
