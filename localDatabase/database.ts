
import { SQLiteDatabase, SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import { Product } from "./types";

const productsTableName = "productsTable";
const shopInformationTable = "shopInformationTable";
// const database = useSQLiteContext();

export const createDbIfNeeded = async (db: SQLiteDatabase) => {
  //
  console.log("Creating database");
  try {
    // Create a table
    const response = await db.execAsync(
        `CREATE TABLE IF NOT EXISTS ${productsTableName}(
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
        yearlyRevenue REAL);`);

    console.log("Database 1 created", response);

    const responseinfo = await db.execAsync(
   `CREATE TABLE IF NOT EXISTS ${shopInformationTable} (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        shopName TEXT NOT NULL,
        DailyRevenue REAL,
        MonthlyRevenue REAL,
        YearlyRevenue REAL,
        WeeklyRevenue REAL,
        DailySales INTEGER,
        MonthlySales INTEGER,
        YearlySales INTEGER,
        WeeklySales INTEGER);`);

  console.log("Database 2 TABLE created", responseinfo);
  console.log("Database created iwufhoqeriuqpgheorighqe SILRUFHWRPFIOUHWRPWHFWORIUF WFIUFHWIEU");
  } catch (error) {
    console.error("Error creating database:", error);
  }
};



export const loadProductsData = async (database: SQLiteDatabase): Promise<Product[] | null> => {
  const result = await database.getAllAsync<Product>(`SELECT * FROM ${productsTableName}`);
  return result;
  // setData(result);
};



export const handleSaveProduct = async (product:Product, database:SQLiteDatabase) => {
  try {
      let Products: Product[] = [product];
    const insertQuery = `
      INSERT INTO ${productsTableName} (
        id, name, price, unit, quantity, 
        isNearlyStockedOut, isStockedOut,
        movingFast, dailySales, weeklySales, 
        monthlySales, yearlySales,
        dailyRevenue, weeklyRevenue, 
        monthlyRevenue, yearlyRevenue
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Prepare the values array
    const values = [
      product.id,
      product.name,
      product.price,
      product.unit,
      product.quantity,
      product.isNearlyStockedOut || null, // Handle optional fields
      product.isStockedOut || null,
      product.movingFast || null,
      product.dailySales || null,
      product.weeklySales || null,
      product.monthlySales || null,
      product.yearlySales || null,
      product.dailyRevenue || null,
      product.weeklyRevenue || null,
      product.monthlyRevenue || null,
      product.yearlyRevenue || null,
    ];

    // Execute the query
    const response = await database.runAsync(insertQuery, values);
    console.log("Item saved successfully:", response?.changes!);
    // router.back();
  } catch (error) {
    console.error("Error saving item:", error);
    // Alert.alert("Error saving item:", error.toString());
  }
};


