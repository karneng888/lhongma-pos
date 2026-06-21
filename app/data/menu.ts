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

const mainProteinOptions: MenuOptionGroup = {
  id: "main-protein",
  name: "เลือกเนื้อสัตว์หลัก",
  type: "single",
  options: [
    { id: "minced-pork", name: "หมูสับ", price: 0 },
    { id: "sliced-pork", name: "หมูชิ้น", price: 0 },
    { id: "chicken", name: "ไก่", price: 0 },
    { id: "chicken-organs", name: "เครื่องในไก่", price: 0 },
    { id: "pork-liver", name: "ตับหมู", price: 0 },
    { id: "crispy-pork", name: "หมูกรอบ", price: 10 },
    { id: "seafood", name: "ทะเล", price: 10 },
    { id: "minced-beef", name: "เนื้อสับ", price: 5 },
    { id: "sliced-beef", name: "เนื้อชิ้น", price: 5 },
    { id: "crispy-chicken", name: "ไก่กรอบ", price: 0 },
    { id: "stewed-pork", name: "หมูตุ๋น", price: 0 },
    { id: "stewed-beef", name: "เนื้อตุ๋น", price: 5 },
  ],
};

const addProteinOptions: MenuOptionGroup = {
  id: "add-protein",
  name: "เพิ่มเนื้อสัตว์",
  type: "multiple",
  options: [
    { id: "add-minced-pork", name: "เพิ่มหมูสับ", price: 10 },
    { id: "add-sliced-pork", name: "เพิ่มหมูชิ้น", price: 10 },
    { id: "add-chicken", name: "เพิ่มไก่", price: 10 },
    { id: "add-chicken-organs", name: "เพิ่มเครื่องในไก่", price: 10 },
    { id: "add-pork-liver", name: "เพิ่มตับหมู", price: 10 },
    { id: "add-crispy-pork", name: "เพิ่มหมูกรอบ", price: 15 },
    { id: "add-seafood", name: "เพิ่มทะเล", price: 15 },
    { id: "add-minced-beef", name: "เพิ่มเนื้อสับ", price: 25 },
    { id: "add-sliced-beef", name: "เพิ่มเนื้อชิ้น", price: 15 },
    { id: "add-crispy-chicken", name: "เพิ่มไก่กรอบ", price: 10 },
    { id: "add-stewed-pork", name: "เพิ่มหมูตุ๋น", price: 10 },
    { id: "add-stewed-beef", name: "เพิ่มเนื้อตุ๋น", price: 15 },
  ],
};

const takeawayOptions: MenuOptionGroup = {
  id: "takeaway",
  name: "การรับอาหาร",
  type: "multiple",
  options: [{ id: "takeaway", name: "กลับบ้าน", price: 0 }],
};


const spicyOptions: MenuOptionGroup = {
  id: "spicy",
  name: "ระดับความเผ็ด",
  type: "single",
  options: [
    { id: "normal", name: "เผ็ดปกติ", price: 0 },
    { id: "less", name: "เผ็ดน้อย", price: 0 },
    { id: "more", name: "เผ็ดมาก", price: 0 },
    { id: "no", name: "ไม่เผ็ด", price: 0 },
  ],
};

const foodTypeOptions: MenuOptionGroup = {
  id: "food-type",
  name: "รูปแบบอาหาร",
  type: "single",
  options: [
    { id: "rice", name: "ราดข้าว", price: 0 },
    { id: "side-dish", name: "เป็นกับข้าว", price: 30 },
  ],
};

const eggOptions: MenuOptionGroup = {
  id: "egg",
  name: "ไข่",
  type: "multiple",
  options: [
    { id: "fried-egg", name: "ไข่ดาว", price: 10 },
    { id: "omelet", name: "ไข่เจียว", price: 15 },
  ],
};

// ใช้กับเมนูผัดเผ็ด ๆ เช่น กะเพรา / พริกแกง / พริกเผา / พริกสด / คั่วพริกเกลือ
const riceSpicyOptions: MenuOptionGroup[] = [
  mainProteinOptions,
  addProteinOptions,
  foodTypeOptions,
  eggOptions,
  spicyOptions,
  takeawayOptions,
];

// ใช้กับเมนูไม่ต้องเลือกระดับเผ็ด แต่ยังมีเป็นกับข้าวได้ เช่น กระเทียม
const riceNoSpicyOptions: MenuOptionGroup[] = [
  mainProteinOptions,
  addProteinOptions,
  foodTypeOptions,
  eggOptions,
  takeawayOptions,
];

// ใช้กับเมนูที่ไม่มีเป็นกับข้าว และไม่ต้องเลือกระดับเผ็ด เช่น ข้าวผัด / ผัดซีอิ๊ว
const riceSimpleOptions: MenuOptionGroup[] = [
  mainProteinOptions,
  addProteinOptions,
  eggOptions,
  takeawayOptions,
];

// ใช้กับสุกี้ อาจเลือกเนื้อสัตว์ได้ แต่ไม่มีไข่ / ไม่มีเป็นกับข้าว / ไม่มีระดับเผ็ด
const sukiOptions: MenuOptionGroup[] = [
  mainProteinOptions,
  addProteinOptions,
  takeawayOptions,
];

// ใช้กับเมนูที่ไม่ต้องมี option อะไรเยอะ เช่น ไข่เจียว / หมูกรอบ 1 ขีด
const simpleTakeawayOptions: MenuOptionGroup[] = [
  takeawayOptions,
];



const noodleOptions: MenuOptionGroup[] = [
  
  {
    id: "noodle-type",
    name: "เลือกเส้น",
    type: "single",
    options: [
      { id: "senlek", name: "เส้นเล็ก", price: 0 },
      { id: "bamee", name: "บะหมี่", price: 0 },
      { id: "senmee", name: "เส้นหมี่ขาว", price: 0 },
      { id: "senyai", name: "เส้นใหญ่", price: 0 },
      { id: "mama", name: "มาม่า", price: 0 },
      { id: "woonsen", name: "วุ้นเส้น", price: 0 },
    ],
  },
  {
    id: "soup-type",
    name: "รูปแบบ",
    type: "single",
    options: [
      { id: "soup", name: "น้ำ", price: 0 },
      { id: "dry", name: "แห้ง", price: 0 },
    ],
  },
  {
    id: "extra",
    name: "ตัวเลือกเพิ่ม",
    type: "multiple",
    options: [
      { id: "special", name: "พิเศษ", price: 10 },
    ],
  },
  {
  id: "takeaway",
  name: "การรับอาหาร",
  type: "multiple",
  options: [
    { id: "takeaway", name: "กลับบ้าน", price: 0 },
  ],
  },

];

export const menuItems: MenuItem[] = [
  {
    id: 1,
    name: "ก๋วยเตี๋ยวไก่มะระ",
    price: 50,
    station: "noodle",
    optionGroups: noodleOptions,
  },
  {
    id: 2,
    name: "ก๋วยเตี๋ยวไก่น้ำใส",
    price: 50,
    station: "noodle",
    optionGroups: noodleOptions,
  },
  {
    id: 3,
    name: "ก๋วยเตี๋ยวเนื้อตุ๋น",
    price: 60,
    station: "noodle",
    optionGroups: noodleOptions,
  },
  {
    id: 4,
    name: "ก๋วยเตี๋ยวหมูตุ๋น",
    price: 50,
    station: "noodle",
    optionGroups: noodleOptions,
  },
  {
    id: 5,
    name: "ก๋วยเตี๋ยวต้มยำหมู",
    price: 50,
    station: "noodle",
    optionGroups: noodleOptions,
  },
  {
    id: 6,
    name: "ก๋วยเตี๋ยวต้มยำหมูกรอบ",
    price: 60,
    station: "noodle",
    optionGroups: noodleOptions,
  },
  {
    id: 7,
    name: "ก๋วยเตี๋ยวต้มยำไก่กรอบ",
    price: 50,
    station: "noodle",
    optionGroups: noodleOptions,
  },
  {
    id: 8,
    name: "เย็นตาโฟ",
    price: 50,
    station: "noodle",
    optionGroups: noodleOptions,
  },
  {
    id: 9,
    name: "เย็นตาโฟทะเล",
    price: 60,
    station: "noodle",
    optionGroups: noodleOptions,
  },
  {
    id: 10,
    name: "ก๋วยเตี๋ยวหมูน้ำใส",
    price: 50,
    station: "noodle",
    optionGroups: noodleOptions,
  },
  
  {
    id: 11,
    name: "น้ำเปล่า",
    price: 10,
    station: "drink",
  },
  {
    id: 12,
    name: "โค้ก",
    price: 20,
    station: "drink",
  },
  {
    id: 13,
    name: "น้ำแดง",
    price: 20,
    station: "drink",
  },
  {
    id: 14,
    name: "น้ำเขียว",
    price: 20,
    station: "drink",
  },
  {
    id: 15,
    name: "น้ำส้ม",
    price: 20,
    station: "drink",
  },
  {
    id: 16,
    name: "ชเวปส์",
    price: 20,
    station: "drink",
  },
  {
    id: 17,
    name: "สไปร์ท",
    price: 20,
    station: "drink",
  },
  {
    id: 18,
    name: "โออิชิน้ำผึ้งมะนาว",
    price: 20,
    station: "drink",
  },
  {
    id: 19,
    name: "โค้กซีโร่ ขวดเล็ก",
    price: 10,
    station: "drink",
  },
  {
    id: 20,
    name: "เก๊กฮวย",
    price: 20,
    station: "drink",
  },
  {
    id: 21,
    name: "ชาไทย",
    price: 20,
    station: "drink",
  },
  {
    id: 22,
    name: "ชามะนาว",
    price: 20,
    station: "drink",
  },
  {
    id: 23,
    name: "โอเลี้ยง",
    price: 20,
    station: "drink",
  },
  {
    id: 24,
    name: "ชาดำเย็น",
    price: 20,
    station: "drink",
  },
  {
    id: 25,
    name: "น้ำแข็ง",
    price: 0,
    station: "drink",
  },


  {
    id: 26,
    name: "ข้าวกะเพรา",
    price: 50,
    station: "rice",
    optionGroups: riceSpicyOptions,
  },
  {
    id: 27,
    name: "ข้าวกระเทียม",
    price: 50,
    station: "rice",
    optionGroups: riceNoSpicyOptions,
  },
  {
    id: 28,
    name: "ข้าวพริกแกง",
    price: 50,
    station: "rice",
    optionGroups: riceSpicyOptions,
  },
  {
    id: 29,
    name: "ข้าวพริกเผา",
    price: 50,
    station: "rice",
    optionGroups: riceSpicyOptions,
  },
  {
    id: 30,
    name: "ข้าวกะเพราหน่อไม้",
    price: 50,
    station: "rice",
    optionGroups: riceSpicyOptions,
  },
  {
    id: 31,
    name: "ข้าวพริกสด",
    price: 50,
    station: "rice",
    optionGroups: riceNoSpicyOptions,
  },
  {
    id: 32,
    name: "ข้าวคั่วพริกเกลือ",
    price: 50,
    station: "rice",
    optionGroups: riceSpicyOptions,
  },
  {
    id: 33,
    name: "ข้าวผัด",
    price: 60,
    station: "rice",
    optionGroups: riceNoSpicyOptions,
  },
  {
    id: 34,
    name: "สุกี้น้ำ",
    price: 60,
    station: "rice",
    optionGroups: sukiOptions,
  },
  {
    id: 35,
    name: "สุกี้แห้ง",
    price: 60,
    station: "rice",
    optionGroups: sukiOptions,
  },
  {
    id: 36,
    name: "เส้นใหญ่ผัดซีอิ๊ว",
    price: 60,
    station: "rice",
    optionGroups: sukiOptions,
  },
  {
    id: 37,
    name: "เส้นหมี่ผัดซีอิ๊ว",
    price: 60,
    station: "rice",
    optionGroups: sukiOptions,
  },
  {
    id: 38,
    name: "ข้าวไข่เจียว 2 ฟอง",
    price: 40,
    station: "rice",
    optionGroups: simpleTakeawayOptions,
  },
  {
    id: 39,
    name: "ข้าวไข่เจียวหมูสับ",
    price: 50,
    station: "rice",
    optionGroups: simpleTakeawayOptions,
  },
  {
    id: 40,
    name: "ข้าวไข่เจียวเนื้อสับ",
    price: 60,
    station: "rice",
    optionGroups: simpleTakeawayOptions,
  },
  {
    id: 41,
    name: "ข้าวไข่เจียวทะเล",
    price: 60,
    station: "rice",
    optionGroups: simpleTakeawayOptions,
  },
  {
    id: 42,
    name: "หมูกรอบ 1 ขีด น้ำจิ้มซีฟู้ด",
    price: 70,
    station: "rice",
    optionGroups: simpleTakeawayOptions,
  },



];