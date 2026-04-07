import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, bikesTable, ridesTable } from "@workspace/db";
import {
  CreateBikeBody,
  UpdateBikeBody,
  GetBikeParams,
  UpdateBikeParams,
  DeleteBikeParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/bikes", async (_req, res): Promise<void> => {
  const bikes = await db.select().from(bikesTable).orderBy(bikesTable.createdAt);

  const bikesWithKm = await Promise.all(
    bikes.map(async (bike) => {
      const result = await db
        .select({ totalKm: sql<number>`COALESCE(SUM(${ridesTable.distanceKm}), 0)` })
        .from(ridesTable)
        .where(eq(ridesTable.bikeId, bike.id));
      return { ...bike, totalKm: result[0]?.totalKm ?? 0 };
    })
  );

  res.json(bikesWithKm);
});

router.post("/bikes", async (req, res): Promise<void> => {
  const parsed = CreateBikeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [bike] = await db.insert(bikesTable).values(parsed.data).returning();
  res.status(201).json({ ...bike, totalKm: 0 });
});

router.get("/bikes/:id", async (req, res): Promise<void> => {
  const params = GetBikeParams.safeParse({ id: Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [bike] = await db.select().from(bikesTable).where(eq(bikesTable.id, params.data.id));
  if (!bike) {
    res.status(404).json({ error: "Bisiklet bulunamadı" });
    return;
  }

  const result = await db
    .select({ totalKm: sql<number>`COALESCE(SUM(${ridesTable.distanceKm}), 0)` })
    .from(ridesTable)
    .where(eq(ridesTable.bikeId, bike.id));

  res.json({ ...bike, totalKm: result[0]?.totalKm ?? 0 });
});

router.patch("/bikes/:id", async (req, res): Promise<void> => {
  const params = UpdateBikeParams.safeParse({ id: Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateBikeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value !== null && value !== undefined) {
      updateData[key] = value;
    }
  }

  const [bike] = await db
    .update(bikesTable)
    .set(updateData)
    .where(eq(bikesTable.id, params.data.id))
    .returning();

  if (!bike) {
    res.status(404).json({ error: "Bisiklet bulunamadı" });
    return;
  }

  const result = await db
    .select({ totalKm: sql<number>`COALESCE(SUM(${ridesTable.distanceKm}), 0)` })
    .from(ridesTable)
    .where(eq(ridesTable.bikeId, bike.id));

  res.json({ ...bike, totalKm: result[0]?.totalKm ?? 0 });
});

router.delete("/bikes/:id", async (req, res): Promise<void> => {
  const params = DeleteBikeParams.safeParse({ id: Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [bike] = await db.delete(bikesTable).where(eq(bikesTable.id, params.data.id)).returning();
  if (!bike) {
    res.status(404).json({ error: "Bisiklet bulunamadı" });
    return;
  }

  res.sendStatus(204);
});

export default router;
