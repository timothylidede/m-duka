export interface Product {
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
  
  export interface shop {
    id?: number; // Optional for creation (auto-incremented by the database)
    name: string;
    email: string;
    Name: string;
    Products: Product[];
    DailyRevenue: number;
    MonthlyRevenue: number;
    YearlyRevenue: number;
    WeeklyRevenue: number;
    DailySales: number;
    MonthlySales: number;
    YearlySales: number;
    WeeklySales: number;
  }
