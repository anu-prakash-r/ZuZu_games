import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import type { KotDetailsItem } from "@/api/kot";
import type { TableBooking } from "@/api/tables";
import {
  formatElapsed,
  sessionChargesForBooking,
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

  const charges = sessionChargesForBooking(booking);
  const foodTotal = items.reduce(
    (sum, item) => sum + (item.totalPrice ?? (item.unitPrice ?? 0) * item.qty),
    0,
  );
  const payable = charges.roomCharge + foodTotal;
  const sameExtraTime =
    charges.extraPersonMinutes.length > 0 &&
    charges.extraPersonMinutes.every(
      (minutes) => minutes === charges.extraPersonMinutes[0],
    );

  return (
    <View className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
      <Text className="text-slate-500 text-[11px] font-black uppercase tracking-wide">
        {`Session Charges · ${formatElapsed(charges.elapsedMinutes)} · ₹${charges.perHeadRate}/person`}
      </Text>

      <View className="mt-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-slate-600 text-xs font-semibold">
            First {charges.existingPersons} person
            {charges.existingPersons === 1 ? "" : "s"}
          </Text>
          <Text className="text-slate-900 text-xs font-bold">
            ₹{charges.existingPersonCharge}
          </Text>
        </View>

        {charges.extraPersons > 0 ? (
          <View className="flex-row items-center justify-between mt-1">
            <Text className="text-slate-600 text-xs font-semibold">
              {`Extra persons · ${charges.extraPersons}${
                sameExtraTime
                  ? ` · ${formatElapsed(charges.extraPersonMinutes[0])}`
                  : ""
              }`}
            </Text>
            <Text className="text-slate-900 text-xs font-bold">
              ₹{charges.extraPersonCharge}
            </Text>
          </View>
        ) : null}
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
