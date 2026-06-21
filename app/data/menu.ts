export type MenuOption = {
  id: string;
  name: string;
  price: number;
};

export type MenuOptionGroup = {
  id: string;
  name: string;
  type: "single" | "multiple";
  options: MenuOption[];
};

export type MenuItem = {
  id: number;
  name: string;
  price: number;
  station: "noodle" | "rice" | "drink";
  optionGroups?: MenuOptionGroup[];
};

export const menuItems: MenuItem[] = [
  {
    id: 1,
    name: "ก๋วยเตี๋ยวหมูต้มยำ",
    price: 50,
    station: "noodle",
    optionGroups: [
      {
        id: "spicy",
        name: "ระดับความเผ็ด",
        type: "single",
        options: [
          { id: "normal", name: "เผ็ดปกติ", price: 0 },
          { id: "less", name: "เผ็ดน้อย", price: 0 },
          { id: "no", name: "ไม่เผ็ด", price: 0 },
        ],
      },
      {
        id: "extra",
        name: "ตัวเลือกเพิ่ม",
        type: "multiple",
        options: [
          { id: "special", name: "พิเศษ", price: 10 },
          { id: "egg", name: "เพิ่มไข่", price: 15 },
        ],
      },
    ],
  },
  {
    id: 2,
    name: "เย็นตาโฟ",
    price: 50,
    station: "noodle",
  },
  {
    id: 3,
    name: "ข้าวกะเพราหมูกรอบ",
    price: 60,
    station: "rice",
    optionGroups: [
      {
        id: "protein",
        name: "เพิ่มเนื้อสัตว์",
        type: "multiple",
        options: [
          { id: "shrimp", name: "เพิ่มกุ้ง", price: 15 },
          { id: "squid", name: "เพิ่มปลาหมึก", price: 15 },
        ],
      },
      {
        id: "egg",
        name: "ไข่",
        type: "multiple",
        options: [
          { id: "fried-egg", name: "ไข่ดาว", price: 15 },
          { id: "omelet", name: "ไข่เจียว", price: 15 },
        ],
      },
      {
        id: "spicy",
        name: "ระดับความเผ็ด",
        type: "single",
        options: [
          { id: "normal", name: "เผ็ดปกติ", price: 0 },
          { id: "less", name: "เผ็ดน้อย", price: 0 },
          { id: "more", name: "เผ็ดมาก", price: 0 },
          { id: "no", name: "ไม่เผ็ด", price: 0 },
        ],
      },
    ],
  },
  {
    id: 4,
    name: "ข้าวผัดต้มยำหมูกรอบ",
    price: 65,
    station: "rice",
    optionGroups: [
      {
        id: "egg",
        name: "ไข่",
        type: "multiple",
        options: [
          { id: "fried-egg", name: "ไข่ดาว", price: 15 },
          { id: "omelet", name: "ไข่เจียว", price: 15 },
        ],
      },
    ],
  },
  {
    id: 5,
    name: "น้ำเปล่า",
    price: 10,
    station: "drink",
  },
];