export interface Product {
    id: string; // Optional for creation (auto-incremented by the database)
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
  
  // The id is a string
  // name is the owner's name
  // Name is the shop's name
  export interface shop {
    id: string; // Optional for creation (auto-incremented by the database)
    ownername: string;
    email: string;
    shopName: string;
    Products: Product[];
    DailyRevenue: number;
    WeeklyRevenue: number;
    MonthlyRevenue: number;
    YearlyRevenue: number;
    DailySales: number;
    MonthlySales: number;
    YearlySales: number;
    WeeklySales: number;
  }

  // getshopProducts  function
