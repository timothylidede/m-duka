export interface shopProduct {
    id?: number; // Optional for creation (auto-incremented by the database)
    name: string;
    price: number;
    quantity: number;
    isNearlyStockedOut: boolean;
    isStockedOut: boolean;
    movingFast: number;
    dailySales: number;
    weeklySales: number;
    monthlySales: number;
    yearlySales: number;
    dailyRevenue: number;
    weeklyRevenue: number;
    monthlyRevenue: number;
    yearlyRevenue: number;
    lastSynchronized?: number; // Optional for synchronization
  }
  
  export interface shopOwner {
    id?: number; // Optional for creation (auto-incremented by the database)
    name: string;
    email: string;
    shopName: string;
    shopProducts: shopProduct[];
    shopDailyRevenue: number;
    shopMonthlyRevenue: number;
    shopYearlyRevenue: number;
    shopWeeklyRevenue: number;
    shopDailySales: number;
    shopMonthlySales: number;
    shopYearlySales: number;
    shopWeeklySales: number;
  }
