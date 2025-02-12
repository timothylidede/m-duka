import SQLite from 'react-native-sqlite-storage';

// Open or create the database
const db = SQLite.openDatabase(
  { name: 'shopOwnerDatabase.db', location: 'default' },
  () => console.log('Shop Owner Database opened successfully'),
  (error) => console.error('Error opening shop owner database', error)
);

// Initialize the database (create tables if they don't exist)
const initializeDatabase = () => {
  db.transaction((tx) => {
    // Create the shop_owners table
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS shop_owners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        shopName TEXT NOT NULL,
        shopDailyRevenue REAL DEFAULT 0,
        shopMonthlyRevenue REAL DEFAULT 0,
        shopYearlyRevenue REAL DEFAULT 0,
        shopWeeklyRevenue REAL DEFAULT 0,
        shopDailySales INTEGER DEFAULT 0,
        shopMonthlySales INTEGER DEFAULT 0,
        shopYearlySales INTEGER DEFAULT 0,
        shopWeeklySales INTEGER DEFAULT 0
      );`,
      [],
      () => console.log('shop_owners table created successfully'),
      (_, error) => console.error('Error creating shop_owners table', error)
    );

    // Create the shop_products table
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS shop_products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shopOwnerId INTEGER NOT NULL,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        quantity INTEGER NOT NULL,
        isNearlyStockedOut BOOLEAN DEFAULT 0,
        isStockedOut BOOLEAN DEFAULT 0,
        movingFast INTEGER DEFAULT 0,
        dailySales INTEGER DEFAULT 0,
        weeklySales INTEGER DEFAULT 0,
        monthlySales INTEGER DEFAULT 0,
        yearlySales INTEGER DEFAULT 0,
        dailyRevenue REAL DEFAULT 0,
        weeklyRevenue REAL DEFAULT 0,
        monthlyRevenue REAL DEFAULT 0,
        yearlyRevenue REAL DEFAULT 0,
        FOREIGN KEY (shopOwnerId) REFERENCES shop_owners (id) ON DELETE CASCADE
      );`,
      [],
      () => console.log('shop_products table created successfully'),
      (_, error) => console.error('Error creating shop_products table', error)
    );
  });
};

export { db, initializeDatabase };