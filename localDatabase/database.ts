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
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        Name TEXT NOT NULL,
        DailyRevenue REAL,
        MonthlyRevenue REAL,
        YearlyRevenue REAL,
        WeeklyRevenue REAL,
        DailySales INTEGER,
        MonthlySales INTEGER,
        YearlySales INTEGER,
        WeeklySales INTEGER
      );`,
      [],
      () => console.log('shop_information table created successfully'),
      (_, error) => console.error('Error creating shop_information table', error)
    );

    // Create the shop_products table
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS shop_products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        unit TEXT NOT NULL,
        price REAL NOT NULL,
        quantity INTEGER NOT NULL,
        isNearlyStockedOut BOOLEAN,
        isStockedOut BOOLEAN,
        movingFast REAL,
        dailySales INTEGER,
        weeklySales INTEGER,
        monthlySales INTEGER,
        yearlySales INTEGER,
        dailyRevenue REAL,
        weeklyRevenue REAL,
        monthlyRevenue REAL,
        yearlyRevenue REAL,
      );`,
      [],
      () => console.log('shop_products table created successfully'),
      (_, error) => console.error('Error creating shop_products table', error)
    );
  });
};

export { db, initializeDatabase };