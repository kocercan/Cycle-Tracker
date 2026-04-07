import { pgTable, text, serial, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bikesTable = pgTable("bikes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  type: text("type").notNull().default("road"),
  color: text("color"),
  purchaseDate: text("purchase_date"),
  totalKm: real("total_km").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBikeSchema = createInsertSchema(bikesTable).omit({ id: true, totalKm: true, createdAt: true, updatedAt: true });
export type InsertBike = z.infer<typeof insertBikeSchema>;
export type Bike = typeof bikesTable.$inferSelect;
