import { db } from './database';
import { shop, Product } from './types';

// Create a new shop owner
const createShopOwner = (shop: shop, callback: (id: number) => void) => {
  db.transaction((tx) => {
    tx.executeSql(
      `INSERT INTO shop_information (
        name, email, shopName, shopDailyRevenue, shopMonthlyRevenue,
        shopYearlyRevenue, shopWeeklyRevenue, shopDailySales,
        shopMonthlySales, shopYearlySales, shopWeeklySales
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        shop.ownername,
        shop.email,
        shop.shopName,
        shop.DailyRevenue,
        shop.MonthlyRevenue,
        shop.YearlyRevenue,
        shop.WeeklyRevenue,
        shop.DailySales,
        shop.MonthlySales,
        shop.YearlySales,
        shop.WeeklySales,
      ],
      (_, result) => callback(result.insertId),
      (_, error) => console.error('Error creating shop owner', error)
    );
  });
};

// Update a shop 
const updateShop = (shop: shop, callback: (rowsAffected: number) => void) => {
  db.transaction((tx) => {
    tx.executeSql(
      `UPDATE shop_owners SET
        name = ?, email = ?, shopName = ?, shopDailyRevenue = ?,
        shopMonthlyRevenue = ?, shopYearlyRevenue = ?, shopWeeklyRevenue = ?,
        shopDailySales = ?, shopMonthlySales = ?, shopYearlySales = ?,
        shopWeeklySales = ?
      WHERE id = ?;`,
      [
        shop.ownername,
        shop.email,
        shop.shopName,
        shop.DailyRevenue,
        shop.MonthlyRevenue,
        shop.YearlyRevenue,
        shop.WeeklyRevenue,
        shop.DailySales,
        shop.MonthlySales,
        shop.YearlySales,
        shop.WeeklySales,
        shop.id,
      ],
      (_, result) => callback(result.rowsAffected),
      (_, error) => console.error('Error updating shop owner', error)
    );
  });
};

//update a shop's daily revenue
const updateShopDailyRevenue = (shopId: string, dailyRevenue: number, callback: (rowsAffected: number) => void) => {
  db.transaction((tx) => {
    tx.executeSql(
      `UPDATE shop_information SET shopDailyRevenue = ? WHERE id = ?;`,
      [dailyRevenue, shopId],
      (_, result) => callback(result.rowsAffected),
      (_, error) => console.error('Error updating shop daily revenue', error)
    );
  });
}; 

// Add a product to a shop owner
const addShopProduct = (product: Product, callback: (id: number) => void) => {
  db.transaction((tx) => {
    tx.executeSql(
      `INSERT INTO shop_products (
        shopOwnerId, name, price, quantity, 
        isNearlyStockedOut, isStockedOut,
        movingFast, dailySales, weeklySales, 
        monthlySales, yearlySales,
        dailyRevenue, weeklyRevenue, 
        monthlyRevenue, yearlyRevenue
      ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        product.id,
        product.name,
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
      ],
      (_, result) => callback(result.insertId),
      (_, error) => console.error('Error adding shop product', error)
    );
  });
};

//update a product as stocked out
const updateProductStockedOut = (productId: number, callback: (rowsAffected: number) => void) => {
  db.transaction((tx) => {
    tx.executeSql(
      `UPDATE shop_products SET isStockedOut = 1 WHERE id = ?;`,
      [productId],
      (_, result) => callback(result.rowsAffected),
      (_, error) => console.error('Error updating product as stocked out', error)
    );
  });
};

// Get products for a shop owner
const getShopProducts = (shopId: string, callback: (products: Product[]) => void) => 
    {
      db.transaction( (tx) => {
          tx.executeSql(
            `SELECT * FROM shop_products WHERE shopOwnerId = ?;`,
            [shopId],
            (_, result) => {const products: Product[] = result.rows.raw();callback(products);},
            (_, error) => console.error('Error fetching shop products', error)
          );
        }
      );
    };

export {
  createShopOwner,
//   getShopOwners,
  updateShop,
//   deleteShopOwner,
  addShopProduct,
  updateProductStockedOut,
  updateShopDailyRevenue,
  getShopProducts,
};