/**
 * Restaurant Menu Model
 * Pure calculation module — no React, no fetching
 */

export type RestaurantCategory = "salad" | "main" | "drink";
export type RestaurantMode = "economy" | "luxury";

export interface RestaurantMenuItem {
  id: RestaurantMenuItemId;
  name: string;
  category: RestaurantCategory;
  baseRatio: number;
  resourceId: number;
  dataRepoName: string;
}

export type RestaurantMenuItemId =
  | "milk"
  | "bread"
  | "butter"
  | "cheese"
  | "coffee_powder"
  | "apple_pie"
  | "hamburger"
  | "lasagna"
  | "meat_balls"
  | "salad"
  | "samosa"
  | "cocktails"
  | "orange_juice"
  | "apple_cider"
  | "ginger_beer";

export const CATEGORY_ORDER: RestaurantCategory[] = ["salad", "main", "drink"];

export const CATEGORY_LABELS: Record<RestaurantCategory, string> = {
  salad: "Salad Bar",
  main: "Main Courses",
  drink: "Drinks",
};

export const RESTAURANT_MENU_ITEMS: RestaurantMenuItem[] = [
  { id: "milk", name: "Milk", category: "salad", baseRatio: 288, resourceId: 117, dataRepoName: "Milk" },
  { id: "bread", name: "Bread", category: "salad", baseRatio: 24.89, resourceId: 121, dataRepoName: "Bread" },
  { id: "butter", name: "Butter", category: "salad", baseRatio: 92.6, resourceId: 134, dataRepoName: "Butter" },
  { id: "cheese", name: "Cheese", category: "salad", baseRatio: 38.196, resourceId: 122, dataRepoName: "Cheese" },
  { id: "coffee_powder", name: "Coffee powder", category: "salad", baseRatio: 96.312, resourceId: 119, dataRepoName: "Coffee powder" },
  { id: "apple_pie", name: "Apple pie", category: "main", baseRatio: 16.667, resourceId: 123, dataRepoName: "Apple pie" },
  { id: "hamburger", name: "Hamburger", category: "main", baseRatio: 3.608, resourceId: 129, dataRepoName: "Hamburger" },
  { id: "lasagna", name: "Lasagna", category: "main", baseRatio: 4.073, resourceId: 130, dataRepoName: "Lasagna" },
  { id: "meat_balls", name: "Meat balls", category: "main", baseRatio: 3.505, resourceId: 131, dataRepoName: "Meat balls" },
  { id: "salad", name: "Salad", category: "main", baseRatio: 9.402, resourceId: 142, dataRepoName: "Salad" },
  { id: "samosa", name: "Samosa", category: "main", baseRatio: 10.093, resourceId: 143, dataRepoName: "Samosa" },
  { id: "cocktails", name: "Cocktails", category: "drink", baseRatio: 4.04, resourceId: 132, dataRepoName: "Cocktails" },
  { id: "orange_juice", name: "Orange juice", category: "drink", baseRatio: 144, resourceId: 124, dataRepoName: "Orange juice" },
  { id: "apple_cider", name: "Apple cider", category: "drink", baseRatio: 128.955, resourceId: 125, dataRepoName: "Apple cider" },
  { id: "ginger_beer", name: "Ginger beer", category: "drink", baseRatio: 113.984, resourceId: 126, dataRepoName: "Ginger beer" },
];

export function countMultiplier(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 2.1;
  if (count === 2) return 1.0;
  if (count === 3) return 0.7;
  return 0.55;
}

export interface PresetMenu {
  label: string;
  itemIds: RestaurantMenuItemId[];
}

export const PRESETS: Record<RestaurantMode, PresetMenu> = {
  economy: {
    label: "Economy 223",
    itemIds: ["milk", "coffee_powder", "samosa", "salad", "orange_juice", "apple_cider", "ginger_beer"],
  },
  luxury: {
    label: "Luxury 544",
    itemIds: ["milk", "coffee_powder", "butter", "cheese", "bread", "samosa", "salad", "apple_pie", "hamburger", "apple_cider", "orange_juice", "ginger_beer", "cocktails"],
  },
};