export const dynamic = "force-dynamic";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
type Day = (typeof DAYS)[number];

type DayMenu = { breakfast: string[]; lunch: string[]; dinner: string[] };

export const WEEKLY_MENU: Record<Day, DayMenu> = {
  monday: {
    breakfast: ["Scrambled Eggs", "Oatmeal (vegan)", "Fresh Fruit", "Coffee & Tea"],
    lunch:     ["Grilled Chicken Sandwich", "Caesar Salad (vegan)", "Tomato Soup", "Iced Tea"],
    dinner:    ["Spaghetti Bolognese", "Margherita Pizza (vegan)", "Garlic Bread", "Brownies"],
  },
  tuesday: {
    breakfast: ["Pancakes", "Yogurt Parfait", "Banana Smoothie (vegan)", "Orange Juice"],
    lunch:     ["Burrito Bowl (vegan)", "Chicken Quesadilla", "Nachos", "Lemonade"],
    dinner:    ["Butter Chicken", "Dal Tadka (jain)", "Naan", "Basmati Rice", "Gulab Jamun"],
  },
  wednesday: {
    breakfast: ["French Toast", "Granola (gluten-free)", "Mixed Berries", "Hot Chocolate"],
    lunch:     ["Club Sandwich", "Minestrone Soup (vegan)", "Chips", "Soft Drinks"],
    dinner:    ["Grilled Salmon", "Steamed Vegetables (vegan)", "Mashed Potatoes", "Cheesecake"],
  },
  thursday: {
    breakfast: ["Bagels with Cream Cheese", "Fruit Salad (vegan)", "Cereal Bar", "Apple Juice"],
    lunch:     ["Pad Thai (vegan)", "Spring Rolls", "Thai Iced Tea", "Mango Sticky Rice"],
    dinner:    ["Beef Stroganoff", "Garden Salad", "Dinner Rolls", "Apple Pie (gluten-free)"],
  },
  friday: {
    breakfast: ["Eggs Benedict", "Avocado Toast (vegan)", "Hash Browns", "Fresh Juice"],
    lunch:     ["Fish and Chips", "Coleslaw", "Pea Soup", "Water"],
    dinner:    ["BBQ Ribs", "Corn on the Cob", "Baked Beans (vegan)", "Ice Cream Sundae"],
  },
  saturday: {
    breakfast: ["Waffles", "Sausage Links", "Maple Syrup", "Milk"],
    lunch:     ["Margherita Panini (vegan)", "Pasta Salad", "Garlic Knots", "Sparkling Water"],
    dinner:    ["Sushi Platter", "Miso Soup (vegan)", "Edamame", "Green Tea Ice Cream"],
  },
  sunday: {
    breakfast: ["Continental Breakfast", "Croissants", "Jam & Butter", "Herbal Tea (vegan)"],
    lunch:     ["Roast Chicken", "Roasted Potatoes", "Green Beans", "Gravy"],
    dinner:    ["Vegetable Lasagna (vegan)", "Garlic Bread", "Caesar Side Salad", "Tiramisu"],
  },
};

function resolveDay(day: string): Day | null {
  const d = day.trim().toLowerCase();
  if (d === "today") return DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
  return DAYS.includes(d as Day) ? (d as Day) : null;
}

export function getMenu(day: string) {
  const resolved = resolveDay(day);
  if (!resolved) return null;
  return { day: resolved, ...WEEKLY_MENU[resolved] };
}

export function checkDietaryItem(query: string) {
  const q = query.trim().toLowerCase();
  const matches: { day: string; meal: string; item: string }[] = [];
  for (const [day, meals] of Object.entries(WEEKLY_MENU)) {
    for (const [meal, items] of Object.entries(meals)) {
      for (const item of items) {
        if (item.toLowerCase().includes(q)) matches.push({ day, meal, item });
      }
    }
  }
  return matches;
}

export const CAFETERIA_TOOLS = [
  {
    name: "get_menu",
    description: "Get the cafeteria menu for a specific day of the week. Returns breakfast, lunch, and dinner items.",
    input_schema: {
      type: "object",
      properties: { day: { type: "string", description: 'Day of week (monday–sunday) or "today"' } },
      required: ["day"],
    },
  },
  {
    name: "check_dietary_item",
    description: "Search all days and meals for items matching a dietary tag (vegan, jain, gluten-free) or food keyword.",
    input_schema: {
      type: "object",
      properties: { query: { type: "string", description: 'Dietary tag or keyword (e.g. "vegan", "pasta")' } },
      required: ["query"],
    },
  },
];
