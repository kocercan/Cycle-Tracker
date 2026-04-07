import { pgTable, text, serial, timestamp, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { bikesTable } from "./bikes";

export const maintenanceTable = pgTable("maintenance", {
  id: serial("id").primaryKey(),
  bikeId: integer("bike_id").notNull().references(() => bikesTable.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("service"),
  description: text("description").notNull(),
  date: text("date").notNull(),
  cost: real("cost"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMaintenanceSchema = createInsertSchema(maintenanceTable).omit({ id: true, createdAt: true });
export type InsertMaintenance = z.infer<typeof insertMaintenanceSchema>;
export type Maintenance = typeof maintenanceTable.$inferSelect;
