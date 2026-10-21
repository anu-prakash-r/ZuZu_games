import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import type { KotDetailsItem } from "@/api/kot";
import type { TableBooking } from "@/api/tables";
import {
  sessionCharges,
  formatElapsed,
  HOURLY_RATE,
} from "@/utils/sessionCharges";

export default function SessionChargeSummary({
  booking,
  items,
}: {
  booking: TableBooking;
  items: KotDetailsItem[];
}) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const charges = sessionCharges(booking);
  const foodTotal = items.reduce(
    (sum, item) => sum + (item.totalPrice ?? (item.unitPrice ?? 0) * item.qty),
    0,
  );
  const payable = charges.roomCharge + charges.extraPersonCharge + foodTotal;

  return (
    <View className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
      <Text className="text-slate-500 text-[11px] font-black uppercase tracking-wide">
        Session Charges
      </Text>

      <View className="flex-row items-center justify-between mt-2">
        <Text className="text-slate-600 text-xs font-semibold">
          Room · {formatElapsed(charges.elapsedMinutes)} @ ₹{HOURLY_RATE}/hr
        </Text>
        <Text className="text-slate-900 text-xs font-bold">
          ₹{charges.roomCharge}
        </Text>
      </View>

      <View className="flex-row items-center justify-between mt-1.5">
        <Text className="text-slate-600 text-xs font-semibold">
          Extra persons · {charges.extraPersons}
        </Text>
        <Text className="text-slate-900 text-xs font-bold">
          ₹{charges.extraPersonCharge}
        </Text>
      </View>

      <View className="flex-row items-center justify-between mt-1.5">
        <Text className="text-slate-600 text-xs font-semibold">
          Food · {items.length} item{items.length === 1 ? "" : "s"}
        </Text>
        <Text className="text-slate-900 text-xs font-bold">
          ₹{foodTotal.toFixed(2)}
        </Text>
      </View>

      <View className="flex-row items-center justify-between mt-2.5 border-t border-slate-200 pt-2.5">
        <Text className="text-slate-700 text-xs font-black">Payable</Text>
        <Text className="text-[#35116B] font-black text-base">
          ₹{payable.toFixed(2)}
        </Text>
      </View>
    </View>
  );
}
