import { pgTable, text, serial, timestamp, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { bikesTable } from "./bikes";

export const ridesTable = pgTable("rides", {
  id: serial("id").primaryKey(),
  bikeId: integer("bike_id").notNull().references(() => bikesTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  date: text("date").notNull(),
  distanceKm: real("distance_km").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  avgSpeedKmh: real("avg_speed_kmh"),
  maxSpeedKmh: real("max_speed_kmh"),
  elevationGainM: integer("elevation_gain_m"),
  calories: integer("calories"),
  notes: text("notes"),
  routeType: text("route_type"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRideSchema = createInsertSchema(ridesTable).omit({ id: true, createdAt: true });
export type InsertRide = z.infer<typeof insertRideSchema>;
export type Ride = typeof ridesTable.$inferSelect;
