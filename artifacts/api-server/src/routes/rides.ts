import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, ridesTable, bikesTable } from "@workspace/db";
import {
  CreateRideBody,
  UpdateRideBody,
  GetRideParams,
  UpdateRideParams,
  DeleteRideParams,
  ListRidesQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/rides", async (req, res): Promise<void> => {
  const query = ListRidesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let dbQuery = db
    .select({
      id: ridesTable.id,
      bikeId: ridesTable.bikeId,
      bikeName: bikesTable.name,
      title: ridesTable.title,
      date: ridesTable.date,
      distanceKm: ridesTable.distanceKm,
      durationMinutes: ridesTable.durationMinutes,
      avgSpeedKmh: ridesTable.avgSpeedKmh,
      maxSpeedKmh: ridesTable.maxSpeedKmh,
      elevationGainM: ridesTable.elevationGainM,
      calories: ridesTable.calories,
      notes: ridesTable.notes,
      routeType: ridesTable.routeType,
      createdAt: ridesTable.createdAt,
    })
    .from(ridesTable)
    .leftJoin(bikesTable, eq(ridesTable.bikeId, bikesTable.id))
    .orderBy(desc(ridesTable.date)) as ReturnType<typeof db.select>;

  const conditions = [];
  if (query.data.bikeId != null) {
    conditions.push(eq(ridesTable.bikeId, query.data.bikeId));
  }

  if (conditions.length > 0) {
    dbQuery = dbQuery.where(conditions[0]) as typeof dbQuery;
  }

  const rides = await dbQuery;

  const limited = query.data.limit != null ? rides.slice(0, query.data.limit) : rides;
  res.json(limited);
});

router.post("/rides", async (req, res): Promise<void> => {
  const parsed = CreateRideBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [bike] = await db.select().from(bikesTable).where(eq(bikesTable.id, parsed.data.bikeId));
  if (!bike) {
    res.status(404).json({ error: "Bisiklet bulunamadı" });
    return;
  }

  const [ride] = await db.insert(ridesTable).values(parsed.data).returning();

  res.status(201).json({ ...ride, bikeName: bike.name });
});

router.get("/rides/:id", async (req, res): Promise<void> => {
  const params = GetRideParams.safeParse({ id: Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [ride] = await db
    .select({
      id: ridesTable.id,
      bikeId: ridesTable.bikeId,
      bikeName: bikesTable.name,
      title: ridesTable.title,
      date: ridesTable.date,
      distanceKm: ridesTable.distanceKm,
      durationMinutes: ridesTable.durationMinutes,
      avgSpeedKmh: ridesTable.avgSpeedKmh,
      maxSpeedKmh: ridesTable.maxSpeedKmh,
      elevationGainM: ridesTable.elevationGainM,
      calories: ridesTable.calories,
      notes: ridesTable.notes,
      routeType: ridesTable.routeType,
      createdAt: ridesTable.createdAt,
    })
    .from(ridesTable)
    .leftJoin(bikesTable, eq(ridesTable.bikeId, bikesTable.id))
    .where(eq(ridesTable.id, params.data.id));

  if (!ride) {
    res.status(404).json({ error: "Sürüş bulunamadı" });
    return;
  }

  res.json(ride);
});

router.patch("/rides/:id", async (req, res): Promise<void> => {
  const params = UpdateRideParams.safeParse({ id: Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateRideBody.safeParse(req.body);
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

  const [updatedRide] = await db
    .update(ridesTable)
    .set(updateData)
    .where(eq(ridesTable.id, params.data.id))
    .returning();

  if (!updatedRide) {
    res.status(404).json({ error: "Sürüş bulunamadı" });
    return;
  }

  const [bike] = await db.select().from(bikesTable).where(eq(bikesTable.id, updatedRide.bikeId));

  res.json({ ...updatedRide, bikeName: bike?.name ?? null });
});

router.delete("/rides/:id", async (req, res): Promise<void> => {
  const params = DeleteRideParams.safeParse({ id: Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [ride] = await db.delete(ridesTable).where(eq(ridesTable.id, params.data.id)).returning();
  if (!ride) {
    res.status(404).json({ error: "Sürüş bulunamadı" });
    return;
  }

  res.sendStatus(204);
});

export default router;
