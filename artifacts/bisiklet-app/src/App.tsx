import { useState } from "react";
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const api = {
  async get(path: string) {
    const r = await fetch(`${BASE}/api${path}`);
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async post(path: string, body: unknown) {
    const r = await fetch(`${BASE}/api${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async patch(path: string, body: unknown) {
    const r = await fetch(`${BASE}/api${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async del(path: string) {
    const r = await fetch(`${BASE}/api${path}`, { method: "DELETE" });
    if (!r.ok) throw new Error(await r.text());
  },
};

type Ride = {
  id: number;
  title: string;
  date: string;
  distanceKm: number;
  durationMinutes: number;
  notes: string | null;
};

const DEFAULT_BIKE_ID = 1;

function RideForm({ onClose, editRide }: { onClose: () => void; editRide?: Ride }) {
  const qc = useQueryClient();
  const isEdit = !!editRide;

  const [form, setForm] = useState({
    title: editRide?.title ?? "",
    date: editRide?.date ?? new Date().toISOString().split("T")[0],
    distanceKm: editRide ? String(editRide.distanceKm) : "",
    durationMinutes: editRide ? String(editRide.durationMinutes) : "",
    notes: editRide?.notes ?? "",
  });
  const [error, setError] = useState("");

  const createMutation = useMutation({
    mutationFn: () =>
      api.post("/rides", {
        bikeId: DEFAULT_BIKE_ID,
        title: form.title || "Sürüş",
        date: form.date,
        distanceKm: parseFloat(form.distanceKm),
        durationMinutes: parseInt(form.durationMinutes),
        notes: form.notes || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rides"] });
      onClose();
    },
    onError: (e: Error) => setError(e.message),
  });

  const editMutation = useMutation({
    mutationFn: () =>
      api.patch(`/rides/${editRide!.id}`, {
        title: form.title || "Sürüş",
        date: form.date,
        distanceKm: parseFloat(form.distanceKm),
        durationMinutes: parseInt(form.durationMinutes),
        notes: form.notes || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rides"] });
      onClose();
    },
    onError: (e: Error) => setError(e.message),
  });

  const isPending = createMutation.isPending || editMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.distanceKm || !form.durationMinutes) {
      setError("Mesafe ve süre zorunludur.");
      return;
    }
    isEdit ? editMutation.mutate() : createMutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-5">
          {isEdit ? "Sürüşü Düzenle" : "Yeni Sürüş Ekle"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
            <input
              type="text"
              placeholder="ör. Sabah Sürüşü"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mesafe (km)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="0.0"
                value={form.distanceKm}
                onChange={(e) => setForm({ ...form, distanceKm: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sure (dk)</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={form.durationMinutes}
                onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
            <textarea
              placeholder="İsteğe bağlı not..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Iptal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-orange-500 text-white rounded-lg py-2 text-sm font-semibold hover:bg-orange-600 disabled:opacity-60"
            >
              {isPending ? "Kaydediliyor..." : isEdit ? "Guncelle" : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RideCard({ ride, onEdit, onDelete }: { ride: Ride; onEdit: () => void; onDelete: () => void }) {
  const hrs = Math.floor(ride.durationMinutes / 60);
  const mins = ride.durationMinutes % 60;
  const duration = hrs > 0 ? `${hrs}s ${mins}dk` : `${mins}dk`;
  const speed = ride.durationMinutes > 0
    ? ((ride.distanceKm / ride.durationMinutes) * 60).toFixed(1)
    : "0";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="5.5" cy="17.5" r="3.5" />
          <circle cx="18.5" cy="17.5" r="3.5" />
          <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM14 6l-3 6h6" />
          <path d="M5.5 17.5 9 6l2 4h5" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">{ride.title}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {new Date(ride.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
        </p>
        {ride.notes && <p className="text-xs text-gray-400 mt-1 truncate">{ride.notes}</p>}
      </div>
      <div className="flex gap-4 text-center flex-shrink-0">
        <div>
          <p className="text-lg font-bold text-orange-500">{ride.distanceKm.toFixed(1)}</p>
          <p className="text-xs text-gray-400">km</p>
        </div>
        <div>
          <p className="text-lg font-bold text-gray-700">{duration}</p>
          <p className="text-xs text-gray-400">sure</p>
        </div>
        <div>
          <p className="text-lg font-bold text-gray-700">{speed}</p>
          <p className="text-xs text-gray-400">km/s</p>
        </div>
      </div>
      <div className="flex gap-1 ml-1 flex-shrink-0">
        <button
          onClick={onEdit}
          className="text-gray-300 hover:text-orange-400 transition-colors p-1"
          title="Duzenle"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 1 1 3.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
        <button
          onClick={onDelete}
          className="text-gray-300 hover:text-red-400 transition-colors p-1"
          title="Sil"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function App() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingRide, setEditingRide] = useState<Ride | undefined>(undefined);

  const { data: rides = [], isLoading } = useQuery<Ride[]>({
    queryKey: ["rides"],
    queryFn: () => api.get("/rides"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.del(`/rides/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rides"] });
    },
  });

  const totalKm = rides.reduce((s, r) => s + r.distanceKm, 0);
  const totalMinutes = rides.reduce((s, r) => s + r.durationMinutes, 0);
  const totalHrs = Math.floor(totalMinutes / 60);
  const totalMins = totalMinutes % 60;

  const closeForm = () => {
    setShowForm(false);
    setEditingRide(undefined);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {(showForm || editingRide) && (
        <RideForm onClose={closeForm} editRide={editingRide} />
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="5.5" cy="17.5" r="3.5" />
              <circle cx="18.5" cy="17.5" r="3.5" />
              <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM14 6l-3 6h6" />
              <path d="M5.5 17.5 9 6l2 4h5" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Pedal</h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Surus Ekle
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-orange-500">{rides.length}</p>
            <p className="text-xs text-gray-500 mt-1">Toplam Surus</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-800">{totalKm.toFixed(0)}</p>
            <p className="text-xs text-gray-500 mt-1">Toplam km</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-800">
              {totalHrs > 0 ? `${totalHrs}s` : `${totalMins}dk`}
            </p>
            <p className="text-xs text-gray-500 mt-1">Toplam Sure</p>
          </div>
        </div>

        {/* Rides list */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Suruslerim</h2>
          {isLoading ? (
            <div className="text-center py-12 text-gray-400">Yukleniyor...</div>
          ) : rides.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
              <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-orange-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <circle cx="5.5" cy="17.5" r="3.5" />
                  <circle cx="18.5" cy="17.5" r="3.5" />
                  <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM14 6l-3 6h6" />
                  <path d="M5.5 17.5 9 6l2 4h5" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">Henuz surus yok</p>
              <p className="text-gray-400 text-sm mt-1">Ilk surusunu kaydetmek icin butona tikla</p>
            </div>
          ) : (
            <div className="space-y-2">
              {rides.map((ride) => (
                <RideCard
                  key={ride.id}
                  ride={ride}
                  onEdit={() => setEditingRide(ride)}
                  onDelete={() => deleteMutation.mutate(ride.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const queryClient = new QueryClient();

export default function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}
