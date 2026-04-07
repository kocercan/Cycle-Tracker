import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, maintenanceTable, bikesTable } from "@workspace/db";
import {
  CreateMaintenanceBody,
  DeleteMaintenanceParams,
  ListMaintenanceQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/maintenance", async (req, res): Promise<void> => {
  const query = ListMaintenanceQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  let dbQuery = db
    .select({
      id: maintenanceTable.id,
      bikeId: maintenanceTable.bikeId,
      bikeName: bikesTable.name,
      type: maintenanceTable.type,
      description: maintenanceTable.description,
      date: maintenanceTable.date,
      cost: maintenanceTable.cost,
      notes: maintenanceTable.notes,
      createdAt: maintenanceTable.createdAt,
    })
    .from(maintenanceTable)
    .leftJoin(bikesTable, eq(maintenanceTable.bikeId, bikesTable.id))
    .orderBy(desc(maintenanceTable.date)) as ReturnType<typeof db.select>;

  if (query.data.bikeId != null) {
    dbQuery = dbQuery.where(eq(maintenanceTable.bikeId, query.data.bikeId)) as typeof dbQuery;
  }

  const records = await dbQuery;
  res.json(records);
});

router.post("/maintenance", async (req, res): Promise<void> => {
  const parsed = CreateMaintenanceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [bike] = await db.select().from(bikesTable).where(eq(bikesTable.id, parsed.data.bikeId));
  if (!bike) {
    res.status(404).json({ error: "Bisiklet bulunamadı" });
    return;
  }

  const [record] = await db.insert(maintenanceTable).values(parsed.data).returning();

  res.status(201).json({ ...record, bikeName: bike.name });
});

router.delete("/maintenance/:id", async (req, res): Promise<void> => {
  const params = DeleteMaintenanceParams.safeParse({ id: Number(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [record] = await db.delete(maintenanceTable).where(eq(maintenanceTable.id, params.data.id)).returning();
  if (!record) {
    res.status(404).json({ error: "Bakım kaydı bulunamadı" });
    return;
  }

  res.sendStatus(204);
});

export default router;
