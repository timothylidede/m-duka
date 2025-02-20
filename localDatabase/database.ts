import {openDatabase} from 'react-native-sqlite-storage';
import {SQLiteDatabase} from 'react-native-sqlite-storage';
import {enablePromise} from 'react-native-sqlite-storage';
import {Product} from './types';

let productsTableName:String = 'productsTable';
let shopInfoTable:String = 'shopInfoTable';
enablePromise(true);


export const getDBConnection = async ():Promise<SQLiteDatabase>  => {
  console.log('Opening database ...');
  // let db = await openDatabase({name: 'duka.db'});
  // return db;
  const db = await openDatabase(
    { name: 'm-dukaay.db', location: 'default' },
    () => console.log('Shop Owner Database opened successfully'),
    (error) => console.error('Error opening shop owner database', error)
  );
  console.log('Database opened successfully. Going to return it');
  return db;  
};

export const createProductsTable = async (db: SQLiteDatabase) => {
  // create table if not exists
  const query = `CREATE TABLE IF NOT EXISTS ${productsTableName}(
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
        yearlyRevenue REAL
    );`;

  await db.executeSql(query);
};

export const getProducts = async (db: SQLiteDatabase): Promise<Product[]> => {
  try {
    const Products: Product[] = [];
    // Update the SQL query to fetch all required fields
    const results = await db.executeSql(
      `SELECT 
        rowid as id, 
        name, 
        price, 
        unit, 
        quantity, 
        isNearlyStockedOut, 
        isStockedOut, 
        movingFast, 
        dailySales, 
        weeklySales, 
        monthlySales, 
        yearlySales, 
        dailyRevenue, 
        weeklyRevenue, 
        monthlyRevenue, 
        yearlyRevenue, 
        lastSynchronized 
      FROM ${productsTableName}`
    );

    results.forEach(result => {
      for (let index = 0; index < result.rows.length; index++) {
        const row = result.rows.item(index);
        // Map the row data to the Product interface
        const product: Product = {
          id: row.id,
          name: row.name,
          price: row.price,
          unit: row.unit,
          quantity: row.quantity,
          isNearlyStockedOut: row.isNearlyStockedOut || false, // Default to false if undefined
          isStockedOut: row.isStockedOut || false, // Default to false if undefined
          movingFast: row.movingFast || 0, // Default to 0 if undefined
          dailySales: row.dailySales || 0,
          weeklySales: row.weeklySales || 0,
          monthlySales: row.monthlySales || 0,
          yearlySales: row.yearlySales || 0,
          dailyRevenue: row.dailyRevenue || 0,
          weeklyRevenue: row.weeklyRevenue || 0,
          monthlyRevenue: row.monthlyRevenue || 0,
          yearlyRevenue: row.yearlyRevenue || 0,
          lastSynchronized: row.lastSynchronized || null, // Default to null if undefined
        };
        Products.push(product);
      }
    });

    return Products;
  } catch (error) {
    console.error(error);
    throw Error('Failed to get Products !!!');
  }
};

export const saveProducts = async (db: SQLiteDatabase, Products: Product[]) => {
  const insertQuery =
    `INSERT OR REPLACE INTO ${productsTableName}(
        id, name, unit, price, quantity, 
        isNearlyStockedOut, isStockedOut,
        movingFast, dailySales, weeklySales, 
        monthlySales, yearlySales,
        dailyRevenue, weeklyRevenue, 
        monthlyRevenue, yearlyRevenue
      ) values` +
    Products.map(i => `(${i.id}, '${i.name}', ${i.price}, 
      ${i.unit},${i.quantity},${i.isNearlyStockedOut},${i.isStockedOut},${i.movingFast},
      ${i.dailySales},${i.weeklySales},${i.monthlySales},${i.yearlySales},
      ${i.dailyRevenue},${i.weeklyRevenue},${i.monthlyRevenue},${i.yearlyRevenue})`).join(',');

  return db.executeSql(insertQuery);
};

export const deleteProduct = async (db: SQLiteDatabase, id: string) => {
  const deleteQuery = `DELETE from ${productsTableName} where rowid = ${id}`;
  await db.executeSql(deleteQuery);
};

// export const deleteProductsTable = async (db: SQLiteDatabase) => {
//   const query = `drop table ${productsTableName}`;

//   await db.executeSql(query);
// };







// import {
  //   enablePromise,
//   openDatabase,
//   SQLiteDatabase } from "react-native-sqlite-storage"

// // Enable promise for SQLite
// enablePromise(true)

// export const connectToDatabase = async():Promise<SQLiteDatabase> => {
//   return openDatabase({ name: "m-duka.db", location: "default" });
// }

// export const createTables = async (db: SQLiteDatabase) => {
//   const shopProductsQuery = `
//     CREATE TABLE IF NOT EXISTS shopProducts (
//         id TEXT PRIMARY KEY,
//         name TEXT NOT NULL,
//         unit TEXT NOT NULL,
//         price REAL NOT NULL,
//         quantity INTEGER NOT NULL,
//         isNearlyStockedOut BOOLEAN,
//         isStockedOut BOOLEAN,
//         movingFast REAL,
//         dailySales INTEGER,
//         weeklySales INTEGER,
//         monthlySales INTEGER,
//         yearlySales INTEGER,
//         dailyRevenue REAL,
//         weeklyRevenue REAL,
//         monthlyRevenue REAL,
//         yearlyRevenue REAL,
//     )
//   `
//   const shopInformationQuery = `
//    CREATE TABLE IF NOT EXISTS shopInformation (
//         id TEXT PRIMARY KEY,
//         name TEXT NOT NULL,
//         email TEXT NOT NULL,
//         Name TEXT NOT NULL,
//         DailyRevenue REAL,
//         MonthlyRevenue REAL,
//         YearlyRevenue REAL,
//         WeeklyRevenue REAL,
//         DailySales INTEGER,
//         MonthlySales INTEGER,
//         YearlySales INTEGER,
//         WeeklySales INTEGER
//    )
//   `
//   try {
//     await db.executeSql(shopProductsQuery)
//     await db.executeSql(shopInformationQuery)
//   } catch (error) {
//     console.error(error)
//     throw Error(`Failed to create tables`)
//   }
// }





// import SQLite from 'react-native-sqlite-storage';

// // Open or create the database
// const db = SQLite.openDatabase(
//   { name: 'shopDatabase.db', location: 'default' },
//   () => console.log('Shop Owner Database opened successfully'),
//   (error) => console.error('Error opening shop owner database', error)
// );

// // Initialize the database (create tables if they don't exist)
// const initializeDatabase = () => {
//   db.transaction((tx) => {
//     // Create the shop_owners table
//     tx.executeSql(
//       `CREATE TABLE IF NOT EXISTS shop_information (
//         id TEXT PRIMARY KEY,
//         name TEXT NOT NULL,
//         email TEXT NOT NULL,
//         Name TEXT NOT NULL,
//         DailyRevenue REAL,
//         MonthlyRevenue REAL,
//         YearlyRevenue REAL,
//         WeeklyRevenue REAL,
//         DailySales INTEGER,
//         MonthlySales INTEGER,
//         YearlySales INTEGER,
//         WeeklySales INTEGER
//       );`,
//       [],
//       () => console.log('shop_information table created successfully'),
//       (_, error) => console.error('Error creating shop_information table', error)
//     );

//     // Create the shop_products table
//     tx.executeSql(
//       `CREATE TABLE IF NOT EXISTS shop_products (
//         id TEXT PRIMARY KEY,
//         name TEXT NOT NULL,
//         unit TEXT NOT NULL,
//         price REAL NOT NULL,
//         quantity INTEGER NOT NULL,
//         isNearlyStockedOut BOOLEAN,
//         isStockedOut BOOLEAN,
//         movingFast REAL,
//         dailySales INTEGER,
//         weeklySales INTEGER,
//         monthlySales INTEGER,
//         yearlySales INTEGER,
//         dailyRevenue REAL,
//         weeklyRevenue REAL,
//         monthlyRevenue REAL,
//         yearlyRevenue REAL,
//       );`,
//       [],
//       () => console.log('shop_products table created successfully'),
//       (_, error) => console.error('Error creating shop_products table', error)
//     );
//   });
// };

// export { db, initializeDatabase };