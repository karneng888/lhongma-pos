export type MenuOption = {
  id: string;
  name: string;
  englishName?: string;
  price: number;
  stockId?: string;
};

export type MenuOptionGroup = {
  id: string;
  name: string;
  englishName?: string;
  type: "single" | "multiple";
  options: MenuOption[];
};

export type MenuItem = {
  id: number;
  name: string;
  englishName?: string;
  price: number;
  station: "noodle" | "rice" | "drink";
  optionGroups?: MenuOptionGroup[];
};

const mainProteinOptions: MenuOptionGroup = {
  id: "main-protein",
  name: "เลือกเนื้อสัตว์หลัก",
  englishName: "Main Protein",
  type: "single",
  options: [
    { id: "minced-pork", name: "หมูสับ", englishName: "Minced Pork", price: 5 },
    { id: "sliced-pork", name: "หมูชิ้น", englishName: "Sliced Pork", price: 5 },
    { id: "chicken", name: "ไก่", englishName: "Chicken", price: 0 },
    { id: "chicken-organs", name: "เครื่องในไก่", englishName: "Chicken Giblets", price: 5 },
    { id: "pork-liver", name: "ตับหมู", englishName: "Pork Liver",  price: 5 },
    { id: "crispy-pork", name: "หมูกรอบ", englishName: "Crispy Pork",  price: 15 },
    { id: "seafood", name: "ทะเล", englishName: "Seafood",  price: 15 },
    { id: "minced-beef", name: "เนื้อสับ", englishName: "Minced Beef",  price: 10 },
    { id: "sliced-beef", name: "เนื้อชิ้น", englishName: "Sliced Beef",  price: 10 },
    { id: "crispy-chicken", name: "ไก่กรอบ", englishName: "Crispy Chicken",  price: 5 },
    { id: "stewed-pork", name: "หมูตุ๋น", englishName: "Braised pork", price: 5 },
    { id: "stewed-beef", name: "เนื้อตุ๋น", englishName: "Braised beef", price: 10 },
  ],
};

const mainProteinOptionsSuki: MenuOptionGroup = {
  id: "main-protein",
  name: "เลือกเนื้อสัตว์หลัก",
  englishName: "Main Protein",
  type: "single",
  options: [
    { id: "minced-pork", name: "หมูสับ", englishName: "Minced Pork", price: 10 },
    { id: "sliced-pork", name: "หมูชิ้น", englishName: "Sliced Pork", price: 10 },
    { id: "chicken", name: "ไก่", englishName: "Chicken", price: 0 },
    { id: "chicken-organs", name: "เครื่องในไก่", englishName: "Chicken Giblets", price: 10 },
    { id: "crispy-pork", name: "หมูกรอบ", englishName: "Crispy Pork",  price: 15 },
    { id: "seafood", name: "ทะเล", englishName: "Seafood",  price: 15 },
    { id: "minced-beef", name: "เนื้อสับ", englishName: "Minced Beef",  price: 10 },
    { id: "sliced-beef", name: "เนื้อชิ้น", englishName: "Sliced Beef",  price: 10 },
    { id: "stewed-pork", name: "หมูตุ๋น", englishName: "Braised pork", price: 10 },
    { id: "stewed-beef", name: "เนื้อตุ๋น", englishName: "Braised beef", price: 10 },
  ],
};

const Noodlesprotain: MenuOptionGroup = {
  id: "main-protein",
  name: "เลือกเนื้อสัตว์หลัก",
  englishName: "Main Protein",
  type: "single",
  options: [
    { id: "pork", name: "หมูรวม", englishName: "Pork", price: 0 },
    { id: "chicken", name: "ไก่", englishName: "Chicken",  price: 0 },
    { id: "crispy-pork", name: "หมูกรอบ",englishName: "Crispy pork",  price: 10 },
    { id: "seafood", name: "ทะเล", englishName: "Seafood", price: 10 },
    { id: "beef", name: "เนื้อรวม", englishName: "Beef", price: 10 },
    { id: "crispy-chicken", name: "ไก่กรอบ", englishName: "Crispy Chicken", price: 0 },
    { id: "stewed-pork", name: "หมูตุ๋น", englishName: "Braised pork", price: 0 },
    { id: "stewed-beef", name: "เนื้อตุ๋น", englishName: "Braised Beef", price: 10 },
  ],
};

const NoodlesSoup: MenuOptionGroup = {
  id: "Soup",
  name: "เลือกน้ำซุป",
  englishName: "Soup",
  type: "single",
  options: [
    { id: "clear", name: "น้ำใส", englishName: "Clear Soup", price: 0 },
    { id: "Tomyam", name: "ต้มยำ", englishName: "Tom-Yam", price: 0 },
    { id: "Yentafo-Tomyam", name: "เยนตาโฟต้มยำ", englishName: "Yentafo Tomyam", price: 0 },
    { id: "Yentafo", name: "เยนตาโฟ", englishName: "Yentafo", price: 0 },
    { id: "Bitter", name: "มะระน้ำดำ", englishName: "Bitter Gourd", price: 0 },
    
  ],
};

const addProteinOptions: MenuOptionGroup = {
  id: "add-protein",
  name: "เพิ่มเนื้อสัตว์ ถ้าลูกค้าต้องการเนื้อสัตว์เพิ่มให้เลือกอันนี้ด้วยนะคะ",
  englishName: "Extra Protein if you need",
  type: "multiple",
  options: [
    { id: "add-minced-pork", name: "เพิ่มหมูสับ", englishName: "Add Minced-Pork", price: 10, stockId: "minced-pork" },
    { id: "add-sliced-pork", name: "เพิ่มหมูชิ้น", price: 10, englishName: "Add Sliced pork", stockId: "sliced-pork" },
    { id: "add-chicken", name: "เพิ่มไก่", price: 10, englishName: "Add Chicken", stockId: "chicken" },
    { id: "add-chicken-organs", name: "เพิ่มเครื่องในไก่", englishName: "Add chicken-organs", price: 10, stockId: "chicken-organs" },
    { id: "add-pork-liver", name: "เพิ่มตับหมู", englishName: "Add Pork liver", price: 10, stockId: "pork-liver" },
    { id: "add-crispy-pork", name: "เพิ่มหมูกรอบ", englishName: "Add Crispy-pork", price: 15, stockId: "crispy-pork" },
    { id: "add-seafood", name: "เพิ่มทะเล", englishName: "Add Seafood", price: 15, stockId: "seafood" },
    { id: "add-minced-beef", name: "เพิ่มเนื้อสับ", englishName: "Add Minced-Beef", price: 15, stockId: "minced-beef" },
    { id: "add-sliced-beef", name: "เพิ่มเนื้อชิ้น", englishName: "Add sliced-beef", price: 15, stockId: "sliced-beef" },
    { id: "add-crispy-chicken", name: "เพิ่มไก่กรอบ", englishName: "Add crispy-chicken", price: 10, stockId: "crispy-chicken" },
    { id: "add-stewed-pork", name: "เพิ่มหมูตุ๋น", englishName: "Add stewed-pork", price: 10, stockId: "stewed-pork" },
    { id: "add-stewed-beef", name: "เพิ่มเนื้อตุ๋น", englishName: "Add stewed-beef", price: 15, stockId: "stewed-beef" },
  ],
};

const takeawayOptions: MenuOptionGroup = {
  id: "takeaway",
  name: "สั่งกลับบ้าน",
  englishName: "Takeaway please click",
  type: "single",
  options: [{ id: "takeaway", name: "กลับบ้าน", englishName: "Take away", price: 0 }],
};


const spicyOptions: MenuOptionGroup = {
  id: "spicy",
  name: "ระดับความเผ็ด",
  englishName: "Spicy Level",
  type: "single",
  options: [
    { id: "normal", name: "เผ็ดปกติ", englishName: "Normal Spicy", price: 0 },
    { id: "less", name: "เผ็ดน้อย", englishName: "Less Spicy", price: 0 },
    { id: "more", name: "เผ็ดมาก", englishName: "Extra Spicy", price: 0 },
    { id: "no", name: "ไม่เผ็ด", englishName: "Not Spicy", price: 0 },
  ],
};

const foodTypeOptions: MenuOptionGroup = {
  id: "food-type",
  name: "ถ้าต้องการเป็นกับข้าวกรุณาเลือกเพิ่ม",
  englishName: "Change to a la carte (Dish only)",
  type: "single",
  options: [
    
    { id: "side-dish", name: "เป็นกับข้าว-Dish only", price: 30 },
  ],
};

const eggOptions: MenuOptionGroup = {
  id: "egg",
  name: "ไข่",
  englishName: "Egg",
  type: "multiple",
  options: [
    { id: "fried-egg", name: "ไข่ดาว", englishName: "Fried egg", price: 10 },
    { id: "omelet", name: "ไข่เจียว", englishName: "Omelet", price: 15 },
    { id: "boiled-eeg", name: "ไข่ต้ม", englishName: "Boiled egg", price: 10 },
    { id: "boiled-eeg", name: "ไข่เยี่ยวม้า", englishName: "Century Egg", price: 10 },
  ],
};

const extraOptions: MenuOptionGroup = {
  id: "extra",
  name: "พิเศษ",
  englishName: "Extra",
  type: "single",
  options: [
    { id: "special", name: "พิเศษ", englishName: "Extra", price: 10 },
  ],
};


const NoodlesSoup1: MenuOptionGroup[] = [
  Noodlesprotain,
  NoodlesSoup,
  eggOptions,
  spicyOptions,
  takeawayOptions,
];

// ใช้กับเมนูผัดเผ็ด ๆ เช่น กะเพรา / พริกแกง / พริกเผา / พริกสด / คั่วพริกเกลือ
const riceSpicyOptions: MenuOptionGroup[] = [
  mainProteinOptions,
  addProteinOptions,
  extraOptions,
  spicyOptions,
  eggOptions,
  foodTypeOptions,
  
  takeawayOptions,
];

// ใช้กับเมนูไม่ต้องเลือกระดับเผ็ด แต่ยังมีเป็นกับข้าวได้ เช่น กระเทียม
const riceNoSpicyOptions: MenuOptionGroup[] = [
  mainProteinOptions,
  addProteinOptions,
  extraOptions,
  eggOptions,
  foodTypeOptions,
  takeawayOptions,

];

// ใช้กับเมนูที่ไม่มีเป็นกับข้าว และไม่ต้องเลือกระดับเผ็ด เช่น ข้าวผัด / ผัดซีอิ๊ว
const riceSimpleOptions: MenuOptionGroup[] = [
  mainProteinOptions,
  addProteinOptions,
  extraOptions,
  eggOptions,
  takeawayOptions,
];

// ใช้กับสุกี้ อาจเลือกเนื้อสัตว์ได้ แต่ไม่มีไข่ / ไม่มีเป็นกับข้าว / ไม่มีระดับเผ็ด
const sukiOptions: MenuOptionGroup[] = [
  mainProteinOptionsSuki,
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
    englishName: "Noodle Type",
    type: "single",
    options: [
      { id: "senlek", name: "เส้นเล็ก", englishName: "Thin Rice Noodles", price: 0 },
      { id: "bamee", name: "บะหมี่", englishName: "Egg Noodles", price: 0 },
      { id: "senmee", name: "เส้นหมี่ขาว", englishName: "Rice Vermicelli", price: 0 },
      { id: "senyai", name: "เส้นใหญ่", englishName: "Wide Rice Noodles", price: 0 },
      { id: "mama", name: "มาม่า", englishName: "Instant Noodles", price: 0 },
      { id: "woonsen", name: "วุ้นเส้น", englishName: "Glass Noodles", price: 0 },
    ],
  },
  {
    id: "soup-type",
    name: "รูปแบบ",
    englishName: "Soup Type",
    type: "single",
    options: [
      { id: "soup", name: "น้ำ", englishName: "Soup", price: 0 },
      { id: "dry", name: "แห้ง", englishName: "Dry", price: 0 },
    ],
  },
  {
  id: "egg",
  name: "ไข่",
  englishName: "Egg",
  type: "multiple",
  options: [
    { id: "fried-egg", name: "ไข่ดาว", englishName: "Fried egg", price: 10 },
    { id: "omelet", name: "ไข่เจียว", englishName: "Omelet", price: 15 },
    { id: "boiled-eeg", name: "ไข่ต้ม", englishName: "Boiled egg", price: 10 },
    { id: "boiled-eeg", name: "ไข่เยี่ยวม้า", englishName: "Century Egg", price: 10 },
  ],
  },
  {
    id: "extra",
    name: "Extra",
    type: "single",
    options: [
      { id: "special", name: "พิเศษ-Extra", price: 10 },
    ],
  },
  {
  id: "takeaway",
  name: "ถ้าสั่งกลับบ้านกรุณาเลือกหัวข้อนี้ด้วยค่ะ",
  englishName: "Takeaway please choose",
  type: "single",
  options: [
    { id: "takeaway", name: "กลับบ้าน-Takeaway", price: 0 },
  ],
  },

];
const noodleOptionsSoup: MenuOptionGroup[] = [
  
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
  //{
  //  id: 1,
  //  name: "ก๋วยเตี๋ยวไก่มะระ",
   // englishName: "Chicken Noodle Soup with Bitter Melon",
  //  price: 50,
  //  station: "noodle",
  //  optionGroups: noodleOptions,
  //},
  {
    id: 2,
    name: "ก๋วยเตี๋ยวไก่น้ำใส",
    englishName: "Chicken Noodle with Clear Soup",
    price: 50,
    station: "noodle",
    optionGroups: noodleOptions,
  },
  {
    id: 3,
    name: "ก๋วยเตี๋ยวเนื้อน้ำใส",
    englishName: "Beef Noodles with clear Soup",
    price: 60,
    station: "noodle",
    optionGroups: noodleOptions,
  },
  {
    id: 4,
    name: "ก๋วยเตี๋ยวหมูตุ๋น",
    englishName: "Braised Pork Noodles",
    price: 50,
    station: "noodle",
    optionGroups: noodleOptions,
  },
  {
    id: 5,
    name: "ก๋วยเตี๋ยวต้มยำหมู",
    englishName: "Pork Tom Yum Noodles",
    price: 50,
    station: "noodle",
    optionGroups: noodleOptions,
  },
  {
    id: 6,
    name: "ก๋วยเตี๋ยวต้มยำหมูกรอบ",
    englishName: "Crispy Pork Tom Yum Noodles",
    price: 60,
    station: "noodle",
    optionGroups: noodleOptions,
  },
  {
    id: 7,
    name: "ก๋วยเตี๋ยวต้มยำไก่กรอบ",
    englishName: "Crispy Chicken Tom Yum Noodles",
    price: 50,
    station: "noodle",
    optionGroups: noodleOptions,
  },
  {
    id: 8,
    name: "เย็นตาโฟ",
    englishName: "Yentafo (Pink soup)",
    price: 50,
    station: "noodle",
    optionGroups: noodleOptions,
  },
  {
    id: 9,
    name: "เย็นตาโฟทะเล",
    englishName: "Seafood Yentafo (Pink soup)",
    price: 60,
    station: "noodle",
    optionGroups: noodleOptions,
  },

  
  {
    id: 10,
    name: "เย็นตาโฟหมูกรอบ",
    englishName: "Crispy Pork Yentafo (Pink soup)",
    price: 60,
    station: "noodle",
    optionGroups: noodleOptions,
  },
  
  {
    id: 11,
    name: "ก๋วยเตี๋ยวหมูน้ำใส",
    englishName: "Clear Soup Pork Noodles",
    price: 50,
    station: "noodle",
    optionGroups: noodleOptions,
  },
  
  {
    id: 15,
    name: "น้ำเปล่า",
    englishName: "Drinking Water",
    price: 10,
    station: "drink",
  },
  {
    id: 16,
    name: "โค้ก",
    englishName: "Coke",
    price: 20,
    station: "drink",
  },
  {
    id: 17,
    name: "น้ำแดง",
    englishName: "Red Soda",
    price: 20,
    station: "drink",
  },
  {
    id: 18,
    name: "น้ำเขียว",
    englishName: "Green Soda",
    price: 20,
    station: "drink",
  },
  {
    id: 19,
    name: "น้ำส้ม",
    englishName: "Orange Soda",
    price: 20,
    station: "drink",
  },
  {
    id: 20,
    name: "ชเวปส์มะนาว",
    englishName: "Schweppes lemon soda",
    price: 20,
    station: "drink",
  },
  {
    id: 21,
    name: "สไปร์ท",
    englishName: "Sprite",
    price: 20,
    station: "drink",
  },
  {
    id: 22,
    name: "โออิชิน้ำผึ้งมะนาว",
    englishName: "Oishi Honey Lemon",
    price: 20,
    station: "drink",
  },
  {
    id: 23,
    name: "โค้กซีโร่ ขวดเล็ก",
    englishName: "Coke Zero (small)",
    price: 10,
    station: "drink",
  },
  {
    id: 24,
    name: "เก๊กฮวย",
    englishName: "Iced Chrysanthemum Tea",
    price: 20,
    station: "drink",
  },
  {
    id: 25,
    name: "ชาไทย",
    englishName: "Iced Thai Tea (Sweet)",
    price: 20,
    station: "drink",
  },
  {
    id: 26,
    name: "ชามะนาว",
    englishName: "Lemon Tea",
    price: 20,
    station: "drink",
  },
  {
    id: 27,
    name: "โอเลี้ยง",
    englishName: "Thai Iced Black Coffee (Oliang)",
    price: 20,
    station: "drink",
  },
  {
    id: 28,
    name: "ชาดำเย็น",
    englishName: "Thai Iced Black Tea",
    price: 20,
    station: "drink",
  },
  {
    id: 29,
    name: "น้ำส้ม",
    englishName: "Orange Juice",
    price: 25,
    station: "drink",
  },
  {
    id: 49,
    name: "น้ำแข็ง",
    englishName: "Ice",
    price: 0,
    station: "drink",
  },

  {
    id: 50,
    name: "ข้าวกะเพรา",
    englishName: "Ka-pao with rice",
    price: 45,
    station: "rice",
    optionGroups: riceSpicyOptions,
  },
  {
    id: 51,
    name: "ข้าวกระเทียม",
    englishName: "Garlic Stir fried with rice",
    price: 45,
    station: "rice",
    optionGroups: riceNoSpicyOptions,
  },
  {
    id: 52,
    name: "ข้าวพริกแกง",
    englishName: "Stir-fried Red Curry with Rice",
    price: 45,
    station: "rice",
    optionGroups: riceSpicyOptions,
  },
  {
    id: 53,
    name: "ข้าวพริกเผา",
    englishName: "Stir-fried Chili Paste with Rice",
    price: 45,
    station: "rice",
    optionGroups: riceSpicyOptions,
  },
  {
    id: 54,
    name: "ข้าวกะเพราหน่อไม้",
    englishName: "Stir-fried Holy Basil with Bamboo Shoots and Rice",
    price: 45,
    station: "rice",
    optionGroups: riceSpicyOptions,
  },
  {
    id: 55,
    name: "ข้าวผัดคะน้า",
    englishName: "Chinese Broccoli with Rice",
    price: 45,
    station: "rice",
    optionGroups: riceSpicyOptions,
  },
  {
    id: 56,
    name: "ข้าวพริกสด",
    englishName: "Stir-fried Chili with Rice",
    price: 45,
    station: "rice",
    optionGroups: riceNoSpicyOptions,
  },
  {
    id: 57,
    name: "ข้าวคั่วพริกเกลือ",
    englishName: "Stir-fried Chili and Salt with Rice",
    price: 45,
    station: "rice",
    optionGroups: riceSpicyOptions,
  },
  {
    id: 58,
    name: "ข้าวผัดผักบุ้ง",
    englishName: "Stir-fried Morning Glory with Rice",
    price: 45,
    station: "rice",
    optionGroups: riceSpicyOptions,
  },

  {
    id: 59,
    name: "ข้าวผัดผักกาดขาว",
    englishName: "Stir-fried Cabbage with Rice",
    price: 45,
    station: "rice",
    optionGroups: riceSpicyOptions,
  },
  {
    id: 70,
    name: "ข้าวผัด",
    englishName: "Fried Rice",
    price: 50,
    station: "rice",
    optionGroups: riceNoSpicyOptions,
  },
  {
    id: 71,
    name: "สุกี้น้ำ",
    englishName: "Sukiyaki with Soup",
    price: 50,
    station: "rice",
    optionGroups: sukiOptions,
  },
  {
    id: 72,
    name: "สุกี้แห้ง",
    englishName: "Stir-fried Sukiyaki (Dry)",
    price: 50,
    station: "rice",
    optionGroups: sukiOptions,
  },
  {
    id: 73,
    name: "เส้นใหญ่ผัดซีอิ๊ว",
    englishName: "Stir-fried Large Rice Noodles with Soy Sauce (Pad See Ew)",
    price: 50,
    station: "rice",
    optionGroups: sukiOptions,
  },
  {
    id: 74,
    name: "เส้นหมี่ผัดซีอิ๊ว",
    englishName: "Stir-fried Rice Vermicelli with Soy Sauce (Pad See Ew)",
    price: 50,
    station: "rice",
    optionGroups: sukiOptions,
  },
  {
    id: 75,
    name: "ข้าวไข่เจียว 2 ฟอง",
    englishName: "2 Omelets with rice",
    price: 40,
    station: "rice",
    optionGroups: simpleTakeawayOptions,
  },
  {
    id: 76,
    name: "ข้าวไข่เจียวหมูสับ",
    englishName: "minced-pork Omelets with rice",
    price: 50,
    station: "rice",
    optionGroups: simpleTakeawayOptions,
  },
  {
    id: 77,
    name: "ข้าวไข่เจียวเนื้อสับ",
    englishName: "minced-beef Omelets with rice",
    price: 60,
    station: "rice",
    optionGroups: simpleTakeawayOptions,
  },
  {
    id: 78,
    name: "ข้าวไข่เจียวทะเล",
    englishName: "Seafood Omelets with rice",
    price: 60,
    station: "rice",
    optionGroups: simpleTakeawayOptions,
  },
  {
    id: 79,
    name: "หมูกรอบ 1 ขีด น้ำจิ้มซีฟู้ด",
    englishName: "Crispy Pork with seafood sauce",
    price: 60,
    station: "rice",
    optionGroups: simpleTakeawayOptions,
  },
  {
    id: 80,
    name: "เกาเหลา",
    englishName: "No-Noodle Soup (Gaolaou)",
    price: 50,
    station: "noodle",
    optionGroups: NoodlesSoup1,
  },

  {
    id: 90,
    name: "ข้าวเปล่า",
    englishName: "Rice",
    price: 10,
    station: "rice",
  }


];