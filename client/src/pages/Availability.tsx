import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Plus, Trash2, Clock, Plug, Loader2, RefreshCw, CheckCircle2 } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Format today and 7 days out as YYYY-MM-DD strings */
function getDateRange() {
  const today = new Date();
  const future = new Date(today);
  future.setDate(today.getDate() + 7);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { start: fmt(today), end: fmt(future) };
}

export default function Availability() {
  return (
    <DashboardLayout>
      <AvailabilityContent />
    </DashboardLayout>
  );
}

function AvailabilityContent() {
  const businessQuery = trpc.business.get.useQuery();
  const business = businessQuery.data;
  const utils = trpc.useUtils();

  const slotsQuery = trpc.availability.list.useQuery(
    { businessId: business?.id ?? 0 },
    { enabled: !!business?.id }
  );

  const updateBusinessMutation = trpc.business.update.useMutation({
    onSuccess: () => {
      utils.business.get.invalidate();
      toast.success("Availability mode updated");
    },
  });

  const createSlotMutation = trpc.availability.create.useMutation({
    onSuccess: () => {
      utils.availability.list.invalidate();
      toast.success("Slot added");
    },
  });

  const deleteSlotMutation = trpc.availability.delete.useMutation({
    onSuccess: () => {
      utils.availability.list.invalidate();
      toast.success("Slot removed");
    },
  });

  const toggleSlotMutation = trpc.availability.update.useMutation({
    onSuccess: () => {
      utils.availability.list.invalidate();
    },
  });

  const [newDay, setNewDay] = useState("1");
  const [newStart, setNewStart] = useState("09:00");
  const [newEnd, setNewEnd] = useState("17:00");

  if (!business) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Set up your business profile first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
          Availability
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage when your business is available for bookings.
        </p>
      </div>

      {/* Mode Selection */}
      <Card className="card-premium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Availability Mode
          </CardTitle>
          <CardDescription>
            Choose how availability is determined for your business.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { value: "manual", label: "Manual Slots", desc: "Define time slots manually" },
              { value: "servicetitan", label: "ServiceTitan", desc: "Sync from ServiceTitan API" },
              { value: "jobber", label: "Jobber", desc: "Sync from Jobber API" },
            ].map((mode) => (
              <button
                key={mode.value}
                onClick={() =>
                  updateBusinessMutation.mutate({
                    id: business.id,
                    availabilityMode: mode.value as any,
                  })
                }
                className={`p-4 rounded-xl border text-left transition-all ${
                  business.availabilityMode === mode.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <div className="font-medium text-sm">{mode.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{mode.desc}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Manual Slots */}
      {business.availabilityMode === "manual" && (
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Time Slots
            </CardTitle>
            <CardDescription>
              Define available time slots for each day of the week.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add New Slot */}
            <div className="flex items-end gap-3 p-4 bg-muted/30 rounded-xl">
              <div className="space-y-2 flex-1">
                <Label className="text-xs">Day</Label>
                <Select value={newDay} onValueChange={setNewDay}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((day, i) => (
                      <SelectItem key={i} value={i.toString()}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Start</Label>
                <Input type="time" value={newStart} onChange={(e) => setNewStart(e.target.value)} className="w-32" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">End</Label>
                <Input type="time" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} className="w-32" />
              </div>
              <Button
                onClick={() =>
                  createSlotMutation.mutate({
                    businessId: business.id,
                    dayOfWeek: parseInt(newDay),
                    startTime: newStart,
                    endTime: newEnd,
                  })
                }
                disabled={createSlotMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            {/* Existing Slots */}
            {slotsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading slots...</p>
            ) : slotsQuery.data?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No slots configured. Add your first availability slot above.
              </p>
            ) : (
              <div className="space-y-2">
                {DAYS.map((day, dayIndex) => {
                  const daySlots = slotsQuery.data?.filter((s: any) => s.dayOfWeek === dayIndex) || [];
                  if (daySlots.length === 0) return null;
                  return (
                    <div key={dayIndex} className="flex items-center gap-3 p-3 rounded-lg border border-border/60">
                      <span className="font-medium text-sm w-24">{day}</span>
                      <div className="flex flex-wrap gap-2 flex-1">
                        {daySlots.map((slot: any) => (
                          <div key={slot.id} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5">
                            <span className="text-sm">{slot.startTime} - {slot.endTime}</span>
                            <Switch
                              checked={slot.isActive ?? true}
                              onCheckedChange={(checked) =>
                                toggleSlotMutation.mutate({ id: slot.id, isActive: checked })
                              }
                              className="scale-75"
                            />
                            <button
                              onClick={() => deleteSlotMutation.mutate({ id: slot.id })}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ServiceTitan Live Availability */}
      {business.availabilityMode === "servicetitan" && (
        <ServiceTitanAvailabilityPanel />
      )}

      {/* Jobber Integration Info */}
      {business.availabilityMode === "jobber" && (
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plug className="h-5 w-5 text-primary" />
              Jobber Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configure your Jobber API credentials to sync availability in real-time.
            </p>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Access Token</Label>
                <Input type="password" placeholder="Jobber API Access Token" />
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              Integration ready — connect your account to enable live availability sync
            </Badge>
            <Button className="w-full" onClick={() => toast.info("Jobber integration coming soon")}>
              Save & Test Connection
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/** Live ServiceTitan availability panel — fetches real slots from the API */
function ServiceTitanAvailabilityPanel() {
  const dateRange = useMemo(() => getDateRange(), []);

  const availQuery = trpc.servicetitan.getAvailability.useQuery(
    { startDate: dateRange.start, endDate: dateRange.end, jobDuration: 120 },
    { retry: false }
  );

  const slots = availQuery.data?.slots ?? [];

  return (
    <Card className="card-premium">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Plug className="h-5 w-5 text-primary" />
              ServiceTitan Live Availability
            </CardTitle>
            <CardDescription className="mt-1">
              Showing available slots for the next 7 days from ServiceTitan.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => availQuery.refetch()}
            disabled={availQuery.isFetching}
          >
            {availQuery.isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {availQuery.isLoading ? (
          <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Fetching availability from ServiceTitan…</span>
          </div>
        ) : availQuery.isError ? (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800">
            <p className="font-medium">Failed to load ServiceTitan availability</p>
            <p className="mt-1 text-xs font-mono">{availQuery.error?.message}</p>
          </div>
        ) : slots.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No available slots returned from ServiceTitan for the next 7 days.
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="text-sm text-emerald-700 font-medium">
                {slots.length} slot{slots.length !== 1 ? "s" : ""} available
              </span>
              <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                Live from ServiceTitan
              </Badge>
            </div>
            {slots.map((slot: any, i: number) => (
              <div
                key={slot.id ?? i}
                className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/20"
              >
                <div>
                  <div className="font-medium text-sm">
                    {slot.start
                      ? new Date(slot.start).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {slot.start && slot.end
                      ? `${new Date(slot.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${new Date(slot.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                      : slot.startTime && slot.endTime
                      ? `${slot.startTime} – ${slot.endTime}`
                      : "Time not specified"}
                  </div>
                </div>
                {slot.technicianName && (
                  <Badge variant="outline" className="text-xs">
                    {slot.technicianName}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
