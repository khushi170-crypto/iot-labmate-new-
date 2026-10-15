import { Badge } from "@/components/ui/badge";
import {
  BOOKING_STATUS_META,
  COMPLAINT_STATUS_META,
  EQUIPMENT_CONDITION_META,
  FINE_STATUS_META,
} from "@/lib/constants";
import type {
  BookingStatus,
  ComplaintStatus,
  EquipmentCondition,
  FineStatus,
} from "@/lib/constants";

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const meta = BOOKING_STATUS_META[status];
  return <Badge className={meta.className}>{meta.label}</Badge>;
}

export function FineStatusBadge({ status }: { status: FineStatus | string }) {
  const meta = FINE_STATUS_META[status as FineStatus] ?? FINE_STATUS_META.UNPAID;
  return <Badge className={meta.className}>{meta.label}</Badge>;
}

export function ComplaintStatusBadge({ status }: { status: ComplaintStatus }) {
  const meta = COMPLAINT_STATUS_META[status];
  return <Badge className={meta.className}>{meta.label}</Badge>;
}

export function ConditionBadge({ condition }: { condition: EquipmentCondition }) {
  const meta = EQUIPMENT_CONDITION_META[condition];
  return <Badge className={meta.className}>{meta.label}</Badge>;
}

export function AvailabilityBadge({ availableQty, totalQty }: { availableQty: number; totalQty: number }) {
  const out = availableQty <= 0;
  const low = availableQty > 0 && availableQty <= Math.ceil(totalQty * 0.25);
  return (
    <Badge
      className={
        out
          ? "bg-danger/15 text-danger border-danger/30"
          : low
            ? "bg-warning/15 text-warning border-warning/30"
            : "bg-success/15 text-success border-success/30"
      }
    >
      {out ? "Out of stock" : `${availableQty} / ${totalQty} available`}
    </Badge>
  );
}