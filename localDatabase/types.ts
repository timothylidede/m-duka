export interface Product {
    id: string; // Optional for creation (auto-incremented by the database)
    name: string;
    price: number;
    unit: string;
    quantity: number;
    
    isNearlyStockedOut?: boolean;
    isStockedOut?: boolean;
    movingFast?: number;
    dailySales?: number;
    weeklySales?: number;
    monthlySales?: number;
    yearlySales?: number;
    dailyRevenue?: number;
    weeklyRevenue?: number;
    monthlyRevenue?: number;
    yearlyRevenue?: number;
    lastSynchronized?: number; // Optional for synchronization
  }
  
  
// The id is a string
// contact as a string is used as the primary key for the shops table
  export interface shop {
    id: string; // Optional for creation (auto-incremented by the database)
    ownername: string;
    email: string;
    shopName: string;

    Products?: Product[];
    DailyRevenue?: number;
    WeeklyRevenue?: number;
    MonthlyRevenue?: number;
    YearlyRevenue?: number;
    DailySales?: number;
    MonthlySales?: number;
    YearlySales?: number;
    WeeklySales?: number;
  }

  // getshopProducts  function


  export function createDefaultProduct(): Product {
    return {
      id: '',
      name: '',
      price: 0,
      unit: '',
      quantity: 0,
      isNearlyStockedOut: false,
      isStockedOut: true,
      movingFast: 0,
      dailySales: 0,
      weeklySales: 0,
      monthlySales: 0,
      yearlySales: 0,
      dailyRevenue: 0,
      weeklyRevenue: 0,
      monthlyRevenue: 0,
      yearlyRevenue: 0,
    };
  }

  export function createDefaultShop(): shop {
    return {
      id: '',
      ownername: '',
      email: '',
      shopName: '',
      DailyRevenue: 0,
      WeeklyRevenue: 0,
      MonthlyRevenue: 0,
      YearlyRevenue: 0,
      DailySales: 0,
      MonthlySales: 0,
      YearlySales: 0,
      WeeklySales: 0,
    };
  }