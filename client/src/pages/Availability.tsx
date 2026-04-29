import { useState, useEffect } from "react";
import { Calendar, Plus, Trash2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function Availability() {
  const [mode, setMode] = useState<"manual" | "servicetitan" | "jobber">("manual");
  const { data: slots } = trpc.availability.list.useQuery();
  const { data: business } = trpc.business.get.useQuery();
  const utils = trpc.useUtils();

  const createSlot = trpc.availability.create.useMutation({
    onSuccess: () => {
      utils.availability.list.invalidate();
      toast.success("Slot added");
    },
  });

  const deleteSlot = trpc.availability.delete.useMutation({
    onSuccess: () => {
      utils.availability.list.invalidate();
      toast.success("Slot removed");
    },
  });

  const updateBusiness = trpc.business.update.useMutation({
    onSuccess: () => {
      utils.business.get.invalidate();
      toast.success("Availability mode updated");
    },
  });

  useEffect(() => {
    if (business?.availabilityMode) {
      setMode(business.availabilityMode);
    }
  }, [business]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Availability</h1>
        <p className="text-muted-foreground">
          Choose how availability is determined for your business.
        </p>
      </div>

      {/* Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Availability Mode</CardTitle>
          <CardDescription>
            Connect ServiceTitan or Jobber for real-time availability sync.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { key: "manual", label: "Manual Slots", description: "Define available time slots for each day of the week." },
              { key: "servicetitan", label: "ServiceTitan", description: "Sync from ServiceTitan API" },
              { key: "jobber", label: "Jobber", description: "Sync from Jobber API" },
            ].map((option) => (
              <button
                key={option.key}
                onClick={() => {
                  setMode(option.key as any);
                  updateBusiness.mutate({ availabilityMode: option.key });
                }}
                className={`p-4 rounded-lg border text-left transition-all ${
                  mode === option.key
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "hover:border-muted-foreground/30"
                }`}
              >
                <div className="font-medium text-sm">{option.label}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {option.description}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Manual Slots */}
      {mode === "manual" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Weekly Schedule
            </CardTitle>
            <CardDescription>
              Define available time slots for each day of the week.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {DAYS.map((day) => {
                const daySlots = slots?.filter((s: any) => s.day === day) || [];
                return (
                  <div key={day} className="flex items-start gap-4 py-3 border-b last:border-0">
                    <div className="w-28 font-medium text-sm pt-2">{day}</div>
                    <div className="flex-1 space-y-2">
                      {daySlots.map((slot: any) => (
                        <div key={slot.id} className="flex items-center gap-2">
                          <span className="text-sm">
                            {slot.startTime} - {slot.endTime}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => deleteSlot.mutate({ id: slot.id })}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 text-xs"
                        onClick={() =>
                          createSlot.mutate({
                            day,
                            startTime: "09:00",
                            endTime: "17:00",
                          })
                        }
                      >
                        <Plus className="h-3 w-3" /> Add Slot
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ServiceTitan Integration */}
      {mode === "servicetitan" && (
        <Card>
          <CardHeader>
            <CardTitle>ServiceTitan Integration</CardTitle>
            <CardDescription>
              Connect your ServiceTitan account to sync availability in real-time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Tenant ID</Label>
              <Input placeholder="Your ServiceTitan Tenant ID" />
            </div>
            <div>
              <Label>API Key</Label>
              <Input placeholder="API credentials to sync availability in real-time." type="password" />
            </div>
            <Button>Configure ServiceTitan in Availability settings</Button>
          </CardContent>
        </Card>
      )}

      {/* Jobber Integration */}
      {mode === "jobber" && (
        <Card>
          <CardHeader>
            <CardTitle>Jobber Integration</CardTitle>
            <CardDescription>
              Connect your Jobber account to sync availability in real-time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>API Key</Label>
              <Input placeholder="Jobber API Key" type="password" />
            </div>
            <Button>Configure Jobber in Availability settings</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
