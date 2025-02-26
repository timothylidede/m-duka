
import { SQLiteDatabase, SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import { Product, SalesEvent } from "./types";
import {Alert } from "react-native";

// const productsTableName = "productsTable";
// const shopInformationTable = "shopInformationTable";
export const productsTableName = "productsTable0x0";
export const shopInformationTable = "shopInformationTable0x0";
export const salesHistoryTable = "saleshistoryTable0x0";
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
        description TEXT,
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

    // console.log("Database 1 created", response);

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

  // console.log("Database 2 TABLE created", responseinfo);
  // console.log("Database created iwufhoqeriuqpgheorighqe SILRUFHWRPFIOUHWRPWHFWORIUF WFIUFHWIEU");

  const responseSales = await db.execAsync(
    `CREATE TABLE IF NOT EXISTS ${salesHistoryTable} (
      saleId INTEGER PRIMARY KEY AUTOINCREMENT,
      productId TEXT PRIMARY KEY,
      quantity INTEGER NOT NULL,
      revenue INTEGER NOT NULL,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      day INTEGER NOT NULL,
      hour INTEGER NOT NULL,
      minute INTEGER NOT NULL);`);

  } catch (error) {
    console.error("Error creating database:", error);
  }
};



