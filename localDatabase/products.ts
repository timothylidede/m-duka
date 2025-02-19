


// import { SQLiteDatabase } from 'react-native-sqlite-storage';
// import {Product} from './types';

// export const addproduct = async (db: SQLiteDatabase, product: Product) => {
//     const insertQuery = `
//      INSERT INTO shopProducts (firstName, name, phoneNumber)
//      VALUES (?, ?, ?)
//    `
//     const values = [
//       product.firstName,
//       product.name,
//       product.phoneNumber,
//     ]
//     try {
//       return db.executeSql(insertQuery, values)
//     } catch (error) {
//       console.error(error)
//       throw Error("Failed to add product")
//     }
//   }

  import { SQLiteDatabase } from 'react-native-sqlite-storage';
import {Product} from './types';

export const addproduct = async (db: SQLiteDatabase, product: Product) => {
    const insertQuery = `
      INSERT INTO shopProducts (
        id, name, unit, price, quantity, 
        isNearlyStockedOut, isStockedOut,
        movingFast, dailySales, weeklySales, 
        monthlySales, yearlySales,
        dailyRevenue, weeklyRevenue, 
        monthlyRevenue, yearlyRevenue
      ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`
    
    const values = [
        product.id,
        product.name,
        product.unit,
        product.price,
        product.quantity,
        product.isNearlyStockedOut,
        product.isStockedOut,
        product.movingFast,
        product.dailySales,
        product.weeklySales,
        product.monthlySales,
        product.yearlySales,
        product.dailyRevenue,
        product.weeklyRevenue,
        product.monthlyRevenue,
        product.yearlyRevenue,
    ]

    try {
      return db.executeSql(insertQuery, values)
    } catch (error) {
      console.error(error)
      throw Error("Failed to add product")
    }
  }


  export const getProducts = async (db: SQLiteDatabase): Promise<Product[]> => {
    try {
      const Products: Product[] = []
      const results = await db.executeSql("SELECT * FROM Products")
      results?.forEach((result) => {
        for (let index = 0; index < result.rows.length; index++) {
          Products.push(result.rows.item(index))
        }
      })
      return Products
    } catch (error) {
      console.error(error)
      throw Error("Failed to get Products from database")
    }
  }