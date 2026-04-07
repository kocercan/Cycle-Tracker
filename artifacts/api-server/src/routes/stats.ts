import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db, ridesTable, bikesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/stats/summary", async (_req, res): Promise<void> => {
  const [rideSummary] = await db
    .select({
      totalRides: sql<number>`COUNT(*)`,
      totalKm: sql<number>`COALESCE(SUM(${ridesTable.distanceKm}), 0)`,
      totalMinutes: sql<number>`COALESCE(SUM(${ridesTable.durationMinutes}), 0)`,
      totalCalories: sql<number>`COALESCE(SUM(${ridesTable.calories}), 0)`,
      avgSpeedKmh: sql<number>`COALESCE(AVG(${ridesTable.avgSpeedKmh}), 0)`,
      longestRideKm: sql<number>`COALESCE(MAX(${ridesTable.distanceKm}), 0)`,
    })
    .from(ridesTable);

  const now = new Date();
  const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const [monthSummary] = await db
    .select({
      thisMonthKm: sql<number>`COALESCE(SUM(${ridesTable.distanceKm}), 0)`,
      thisMonthRides: sql<number>`COUNT(*)`,
    })
    .from(ridesTable)
    .where(sql`${ridesTable.date} >= ${firstOfMonth}`);

  const [bikeCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(bikesTable);

  res.json({
    totalRides: Number(rideSummary?.totalRides ?? 0),
    totalKm: Number(rideSummary?.totalKm ?? 0),
    totalMinutes: Number(rideSummary?.totalMinutes ?? 0),
    totalCalories: Number(rideSummary?.totalCalories ?? 0),
    avgSpeedKmh: Number(rideSummary?.avgSpeedKmh ?? 0),
    longestRideKm: Number(rideSummary?.longestRideKm ?? 0),
    thisMonthKm: Number(monthSummary?.thisMonthKm ?? 0),
    thisMonthRides: Number(monthSummary?.thisMonthRides ?? 0),
    totalBikes: Number(bikeCount?.count ?? 0),
  });
});

router.get("/stats/weekly", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      week: sql<string>`TO_CHAR(DATE_TRUNC('week', TO_DATE(${ridesTable.date}, 'YYYY-MM-DD')), 'YYYY-MM-DD')`,
      rides: sql<number>`COUNT(*)`,
      km: sql<number>`COALESCE(SUM(${ridesTable.distanceKm}), 0)`,
      minutes: sql<number>`COALESCE(SUM(${ridesTable.durationMinutes}), 0)`,
    })
    .from(ridesTable)
    .where(sql`TO_DATE(${ridesTable.date}, 'YYYY-MM-DD') >= CURRENT_DATE - INTERVAL '8 weeks'`)
    .groupBy(sql`DATE_TRUNC('week', TO_DATE(${ridesTable.date}, 'YYYY-MM-DD'))`)
    .orderBy(sql`DATE_TRUNC('week', TO_DATE(${ridesTable.date}, 'YYYY-MM-DD'))`);

  res.json(rows.map((r) => ({
    week: r.week,
    rides: Number(r.rides),
    km: Number(r.km),
    minutes: Number(r.minutes),
  })));
});

router.get("/stats/monthly", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      month: sql<string>`TO_CHAR(DATE_TRUNC('month', TO_DATE(${ridesTable.date}, 'YYYY-MM-DD')), 'YYYY-MM')`,
      rides: sql<number>`COUNT(*)`,
      km: sql<number>`COALESCE(SUM(${ridesTable.distanceKm}), 0)`,
      minutes: sql<number>`COALESCE(SUM(${ridesTable.durationMinutes}), 0)`,
    })
    .from(ridesTable)
    .where(sql`TO_DATE(${ridesTable.date}, 'YYYY-MM-DD') >= CURRENT_DATE - INTERVAL '12 months'`)
    .groupBy(sql`DATE_TRUNC('month', TO_DATE(${ridesTable.date}, 'YYYY-MM-DD'))`)
    .orderBy(sql`DATE_TRUNC('month', TO_DATE(${ridesTable.date}, 'YYYY-MM-DD'))`);

  res.json(rows.map((r) => ({
    month: r.month,
    rides: Number(r.rides),
    km: Number(r.km),
    minutes: Number(r.minutes),
  })));
});

export default router;
