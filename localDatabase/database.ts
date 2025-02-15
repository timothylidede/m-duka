import SQLite from 'react-native-sqlite-storage';

// Open or create the database
const db = SQLite.openDatabase(
  { name: 'shopDatabase.db', location: 'default' },
  () => console.log('Shop Owner Database opened successfully'),
  (error) => console.error('Error opening shop owner database', error)
);

// Initialize the database (create tables if they don't exist)
const initializeDatabase = () => {
  db.transaction((tx) => {
    // Create the shop_owners table
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS shop_information (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        Name TEXT NOT NULL,
        DailyRevenue REAL DEFAULT 0,
        MonthlyRevenue REAL DEFAULT 0,
        YearlyRevenue REAL DEFAULT 0,
        WeeklyRevenue REAL DEFAULT 0,
        DailySales INTEGER DEFAULT 0,
        MonthlySales INTEGER DEFAULT 0,
        YearlySales INTEGER DEFAULT 0,
        WeeklySales INTEGER DEFAULT 0
      );`,
      [],
      () => console.log('shop_information table created successfully'),
      (_, error) => console.error('Error creating shop_information table', error)
    );

    // Create the shop_products table
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS shop_products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shopId INTEGER NOT NULL,
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
        FOREIGN KEY (shopId) REFERENCES shop_owners (id) ON DELETE CASCADE
      );`,
      [],
      () => console.log('shop_products table created successfully'),
      (_, error) => console.error('Error creating shop_products table', error)
    );
  });
};

export { db, initializeDatabase };