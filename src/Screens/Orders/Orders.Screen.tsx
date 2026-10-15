import { useState, useEffect } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const BRAND = "#35116B";

const INITIAL_ORDERS = [
  {
    id: "#1041",
    table: "T2",
    createdAt: Date.now() - 35 * 60 * 1000,
    itemsList: [
      { name: "Cold Coffee", qty: 2, price: 120 },
      { name: "Veg Burger", qty: 1, price: 150 },
    ],
  },
  {
    id: "#1042",
    table: "T5",
    createdAt: Date.now() - 75 * 60 * 1000,
    itemsList: [
      { name: "Cheese Pizza", qty: 2, price: 280 },
      { name: "French Fries", qty: 1, price: 110 },
    ],
  },
  {
    id: "#1043",
    table: "T4",
    createdAt: Date.now() - 15 * 60 * 1000,
    itemsList: [{ name: "PS5 Hour Pass", qty: 1, price: 200 }],
  },
  {
    id: "#1044",
    table: "T1",
    createdAt: Date.now() - 5 * 60 * 1000,
    itemsList: [
      { name: "Chicken Biryani", qty: 2, price: 220 },
      { name: "Coke (Can)", qty: 2, price: 50 },
    ],
  },
  {
    id: "#1045",
    table: "T3",
    createdAt: Date.now() - 50 * 60 * 1000,
    itemsList: [
      { name: "White Sauce Pasta", qty: 1, price: 240 },
      { name: "Garlic Bread", qty: 1, price: 130 },
      { name: "Virgin Mojito", qty: 2, price: 140 },
    ],
  },
  {
    id: "#1046",
    table: "Takeaway",
    createdAt: Date.now() - 10 * 60 * 1000,
    itemsList: [
      { name: "Paneer Tikka Roll", qty: 3, price: 160 },
      { name: "Masala Chai", qty: 2, price: 40 },
    ],
  },
  {
    id: "#1047",
    table: "T6",
    createdAt: Date.now() - 120 * 60 * 1000,
    itemsList: [
      { name: "VR Gaming 30Mins", qty: 2, price: 250 },
      { name: "Red Bull", qty: 2, price: 125 },
    ],
  },
];

const MENU_ITEMS = [
  { name: "Cold Coffee", price: 120 },
  { name: "Cheese Pizza", price: 280 },
  { name: "Veg Burger", price: 150 },
  { name: "PS5 Hour Pass", price: 200 },
  { name: "French Fries", price: 110 },
];

export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const getElapsedTime = (createdAt: number) => {
    const diffMs = Date.now() - createdAt;
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} mins`;

    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<any>(null);

  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [billingOrder, setBillingOrder] = useState<any>(null);

  const getOrderTotal = (itemsList: any[]) => {
    return itemsList.reduce((sum, item) => sum + item.price * item.qty, 0);
  };

  const handleEditOrder = (order: any) => {
    setActiveOrder(JSON.parse(JSON.stringify(order)));
    setIsModalOpen(true);
  };

  const handleIncreaseQty = (index: number) => {
    if (!activeOrder) return;
    const updatedList = [...activeOrder.itemsList];
    updatedList[index].qty += 1;
    setActiveOrder({ ...activeOrder, itemsList: updatedList });
  };

  const handleDecreaseQty = (index: number) => {
    if (!activeOrder) return;
    const updatedList = [...activeOrder.itemsList];
    if (updatedList[index].qty > 1) {
      updatedList[index].qty -= 1;
    } else {
      updatedList.splice(index, 1);
    }
    setActiveOrder({ ...activeOrder, itemsList: updatedList });
  };

  const handleAddItem = (menuItem: any) => {
    if (!activeOrder) return;
    const existing = activeOrder.itemsList.find(
      (i: any) => i.name === menuItem.name,
    );
    if (existing) {
      existing.qty += 1;
    } else {
      activeOrder.itemsList.push({
        name: menuItem.name,
        qty: 1,
        price: menuItem.price,
      });
    }
    setActiveOrder({ ...activeOrder });
  };

  const handleSaveOrder = () => {
    setOrders(orders.map((o) => (o.id === activeOrder.id ? activeOrder : o)));
    setIsModalOpen(false);
  };

  const handleDeleteOrder = (orderId: string) => {
    Alert.alert(
      "Delete Order",
      "Are you sure you want to delete this order and close the Room session?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setOrders(orders.filter((o) => o.id !== orderId));
            setIsModalOpen(false);
          },
        },
      ],
    );
  };

  const handleFinishBill = (order: any) => {
    setBillingOrder(order);
    setIsBillModalOpen(true);
  };

  const handleCompletePayment = () => {
    if (!billingOrder) return;
    setOrders(orders.filter((o) => o.id !== billingOrder.id));
    setIsBillModalOpen(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-row items-center justify-between px-5 py-3 border-b border-slate-200">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/home" as any);
              }
            }}
            activeOpacity={0.7}
            className="w-10 h-10 rounded-2xl items-center justify-center"
          >
            <Ionicons name="arrow-back" size={20} color={BRAND} />
          </TouchableOpacity>
          <Text className="text-[#35116B] text-xl font-extrabold tracking-tight">
            Orders
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5 pt-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 150 }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider">
            Active Orders ({orders.length})
          </Text>
        </View>

        <View className="gap-4">
          {orders.map((order) => {
            const totalAmount = getOrderTotal(order.itemsList);
            const totalItemsCount = order.itemsList.reduce(
              (sum, i) => sum + i.qty,
              0,
            );
            const liveTime = getElapsedTime(order.createdAt);

            return (
              <View
                key={order.id}
                className="bg-white border border-slate-300 p-5 rounded-3xl  justify-between"
              >
                <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
                  <View className="flex-row items-center gap-3">
                    <View className="w-12 h-12 rounded-2xl bg-purple-50 items-center justify-center border border-purple-100">
                      <Text className="text-[#35116B] font-black text-lg">
                        {order.table}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-slate-900 font-extrabold text-base">
                        Room {order.table}
                      </Text>
                      <Text className="text-slate-400 text-xs font-medium">
                        Order ID: {order.id}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center gap-1 bg-amber-500/15 px-2.5 py-1 rounded-xl border border-amber-400/30">
                    <Ionicons name="time-outline" size={13} color="#D97706" />
                    <Text className="text-amber-700 font-bold text-xs">
                      {liveTime}
                    </Text>
                  </View>
                </View>

                <View className="py-3 gap-2">
                  <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    Ordered Items ({totalItemsCount})
                  </Text>
                  {order.itemsList.map((item, idx) => (
                    <View
                      key={idx}
                      className="flex-row items-center justify-between"
                    >
                      <Text className="text-slate-700 text-sm font-semibold">
                        {item.qty}x {item.name}
                      </Text>
                      <Text className="text-slate-900 text-sm font-bold">
                        ₹{item.price * item.qty}
                      </Text>
                    </View>
                  ))}
                </View>

                <View className="pt-3 border-t border-slate-100 flex-row items-center justify-between">
                  <View>
                    <Text className="text-slate-400 text-[10px] uppercase font-bold">
                      Total Bill
                    </Text>
                    <Text className="text-[#35116B] font-black text-xl">
                      ₹{totalAmount}
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-2">
                    <TouchableOpacity
                      onPress={() => handleEditOrder(order)}
                      activeOpacity={0.7}
                      className="bg-slate-100 px-3 py-2 rounded-xl flex-row items-center gap-1 border border-slate-200"
                    >
                      <Ionicons
                        name="create-outline"
                        size={14}
                        color="#35116B"
                      />
                      <Text className="text-[#35116B] font-bold text-xs">
                        Edit
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleFinishBill(order)}
                      activeOpacity={0.8}
                      className="bg-[#35116B] px-4 py-2 rounded-xl flex-row items-center gap-1 shadow-sm"
                    >
                      <Ionicons
                        name="receipt-outline"
                        size={14}
                        color="#FFFFFF"
                      />
                      <Text className="text-white font-bold text-xs">
                        Finish Bill
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <Modal
        visible={isModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalOpen(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/60"
          onPress={() => setIsModalOpen(false)}
        >
          <Pressable
            className="bg-white rounded-t-[32px] p-6 max-h-[90%]"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <Text className="text-xl font-extrabold text-[#35116B]">
                Edit Order — Room {activeOrder?.table}
              </Text>
              <TouchableOpacity
                onPress={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center"
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {activeOrder?.itemsList.map((item: any, idx: number) => (
                <View
                  key={idx}
                  className="flex-row items-center justify-between bg-slate-50 p-3.5 rounded-2xl mb-2.5 border border-slate-200"
                >
                  <View className="flex-1 pr-2">
                    <Text className="text-slate-900 font-bold text-sm">
                      {item.name}
                    </Text>
                    <Text className="text-purple-900 font-extrabold text-xs">
                      ₹{item.price * item.qty}
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-3 bg-white px-3 py-2 rounded-xl border border-slate-200">
                    <TouchableOpacity
                      onPress={() => handleDecreaseQty(idx)}
                      activeOpacity={0.7}
                      className="w-8 h-8 rounded-lg bg-slate-100 items-center justify-center"
                    >
                      <Ionicons name="remove" size={16} color="#35116B" />
                    </TouchableOpacity>

                    <Text className="font-extrabold text-slate-900 text-md min-w-[16px] text-center">
                      {item.qty}
                    </Text>

                    <TouchableOpacity
                      onPress={() => handleIncreaseQty(idx)}
                      activeOpacity={0.7}
                      className="w-8 h-8 rounded-lg bg-[#35116B] items-center justify-center"
                    >
                      <Ionicons name="add" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <Text className="text-slate-700 font-bold text-xs uppercase mt-4 mb-2">
                Add More Food Items
              </Text>
              <View className="gap-2">
                {MENU_ITEMS.map((menuItem, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => handleAddItem(menuItem)}
                    className="flex-row items-center justify-between bg-purple-50/50 border border-purple-100 p-3.5 rounded-2xl active:bg-purple-100"
                  >
                    <Text className="text-[#35116B] font-bold text-sm">
                      + {menuItem.name}
                    </Text>
                    <Text className="text-[#35116B] font-black text-sm">
                      ₹{menuItem.price}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <View className="pt-4 border-t border-slate-100 flex-row gap-3">
              <TouchableOpacity
                onPress={() => handleDeleteOrder(activeOrder?.id)}
                className="bg-red-50 border border-red-200 py-3.5 px-4 rounded-2xl items-center justify-center"
              >
                <Ionicons name="trash" size={18} color="#EF4444" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveOrder}
                className="flex-1 bg-[#35116B] py-3.5 rounded-2xl items-center justify-center shadow-md shadow-purple-900/20"
              >
                <Text className="text-white font-bold text-base">
                  Save Changes
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={isBillModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsBillModalOpen(false)}
      >
        <Pressable
          className="flex-1 justify-center items-center bg-black/60 px-5"
          onPress={() => setIsBillModalOpen(false)}
        >
          <Pressable
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="items-center mb-4">
              <View className="w-14 h-14 rounded-full bg-purple-50 items-center justify-center mb-2">
                <Ionicons name="receipt" size={28} color={BRAND} />
              </View>
              <Text className="text-xl font-black text-[#35116B]">
                Invoice & Bill Summary
              </Text>
              <Text className="text-slate-400 text-xs">
                Room {billingOrder?.table} · Order {billingOrder?.id}
              </Text>
            </View>

            <View className="py-3 border-t border-b border-slate-100 mb-4 gap-2">
              {billingOrder?.itemsList.map((item: any, idx: number) => (
                <View key={idx} className="flex-row justify-between">
                  <Text className="text-slate-600 text-sm">
                    {item.qty}x {item.name}
                  </Text>
                  <Text className="text-slate-900 font-bold text-sm">
                    ₹{item.price * item.qty}
                  </Text>
                </View>
              ))}
            </View>

            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-slate-700 font-bold text-base">
                Grand Total
              </Text>
              <Text className="text-[#35116B] font-black text-2xl">
                ₹{billingOrder ? getOrderTotal(billingOrder.itemsList) : 0}
              </Text>
            </View>

            <View className="gap-2">
              <TouchableOpacity
                onPress={handleCompletePayment}
                className="bg-emerald-500 py-4 rounded-2xl items-center shadow-lg shadow-emerald-500/20"
              >
                <Text className="text-white font-bold text-base">
                  Print the bill
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsBillModalOpen(false)}
                className="py-3.5 mt-2 items-center bg-slate-200 rounded-2xl"
              >
                <Text className="text-black font-semibold text-base">
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
