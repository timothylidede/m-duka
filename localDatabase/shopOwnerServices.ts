import { db } from './database';
import { shopOwner, shopProduct } from './types';

// Create a new shop owner
const createShopOwner = (shopOwner: Omit<shopOwner, 'id'>, callback: (id: number) => void) => {
  db.transaction((tx) => {
    tx.executeSql(
      `INSERT INTO shop_owners (
        name, email, shopName, shopDailyRevenue, shopMonthlyRevenue,
        shopYearlyRevenue, shopWeeklyRevenue, shopDailySales,
        shopMonthlySales, shopYearlySales, shopWeeklySales
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        shopOwner.name,
        shopOwner.email,
        shopOwner.shopName,
        shopOwner.shopDailyRevenue,
        shopOwner.shopMonthlyRevenue,
        shopOwner.shopYearlyRevenue,
        shopOwner.shopWeeklyRevenue,
        shopOwner.shopDailySales,
        shopOwner.shopMonthlySales,
        shopOwner.shopYearlySales,
        shopOwner.shopWeeklySales,
      ],
      (_, result) => callback(result.insertId),
      (_, error) => console.error('Error creating shop owner', error)
    );
  });
};

// Read all shop owners
const getShopOwners = (callback: (shopOwners: shopOwner[]) => void) => {
  db.transaction((tx) => {
    tx.executeSql(
      `SELECT * FROM shop_owners;`,
      [],
      (_, result) => {
        const shopOwners: shopOwner[] = result.rows.raw();
        callback(shopOwners);
      },
      (_, error) => console.error('Error fetching shop owners', error)
    );
  });
};

// Update a shop owner
const updateShopOwner = (shopOwner: shopOwner, callback: (rowsAffected: number) => void) => {
  db.transaction((tx) => {
    tx.executeSql(
      `UPDATE shop_owners SET
        name = ?, email = ?, shopName = ?, shopDailyRevenue = ?,
        shopMonthlyRevenue = ?, shopYearlyRevenue = ?, shopWeeklyRevenue = ?,
        shopDailySales = ?, shopMonthlySales = ?, shopYearlySales = ?,
        shopWeeklySales = ?
      WHERE id = ?;`,
      [
        shopOwner.name,
        shopOwner.email,
        shopOwner.shopName,
        shopOwner.shopDailyRevenue,
        shopOwner.shopMonthlyRevenue,
        shopOwner.shopYearlyRevenue,
        shopOwner.shopWeeklyRevenue,
        shopOwner.shopDailySales,
        shopOwner.shopMonthlySales,
        shopOwner.shopYearlySales,
        shopOwner.shopWeeklySales,
        shopOwner.id,
      ],
      (_, result) => callback(result.rowsAffected),
      (_, error) => console.error('Error updating shop owner', error)
    );
  });
};

// Delete a shop owner
const deleteShopOwner = (id: number, callback: (rowsAffected: number) => void) => {
  db.transaction((tx) => {
    tx.executeSql(
      'DELETE FROM shop_owners WHERE id = ?;',
      [id],
      (_, result) => callback(result.rowsAffected),
      (_, error) => console.error('Error deleting shop owner', error)
    );
  });
};

// Add a product to a shop owner
const addShopProduct = (shopOwnerId: number, product: Omit<shopProduct, 'id'>, callback: (id: number) => void) => {
  db.transaction((tx) => {
    tx.executeSql(
      `INSERT INTO shop_products (
        shopOwnerId, name, price, quantity, isNearlyStockedOut, isStockedOut,
        movingFast, dailySales, weeklySales, monthlySales, yearlySales,
        dailyRevenue, weeklyRevenue, monthlyRevenue, yearlyRevenue
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        shopOwnerId,
        product.name,
        product.price,
        product.quantity,
        product.isNearlyStockedOut ? 1 : 0,
        product.isStockedOut ? 1 : 0,
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

// Get products for a shop owner
const getShopProducts = (shopOwnerId: number, callback: (products: shopProduct[]) => void) => {
  db.transaction((tx) => {
    tx.executeSql(
      `SELECT * FROM shop_products WHERE shopOwnerId = ?;`,
      [shopOwnerId],
      (_, result) => {
        const products: shopProduct[] = result.rows.raw();
        callback(products);
      },
      (_, error) => console.error('Error fetching shop products', error)
    );
  });
};

export {
  createShopOwner,
  getShopOwners,
  updateShopOwner,
  deleteShopOwner,
  addShopProduct,
  getShopProducts,
};