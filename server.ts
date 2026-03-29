import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("restaurant.db", { verbose: console.log });

try {
  // Initialize Database
  db.exec(`
    CREATE TABLE IF NOT EXISTS tables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_number TEXT UNIQUE,
      status TEXT DEFAULT 'AVAILABLE'
    );

    DROP TABLE IF EXISTS menu_items;
    CREATE TABLE menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      category TEXT,
      price REAL,
      is_veg INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      subtotal REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      grand_total REAL DEFAULT 0,
      order_type TEXT DEFAULT 'DINE_IN',
      status TEXT DEFAULT 'OPEN',
      FOREIGN KEY (table_id) REFERENCES tables(id)
    );

    CREATE TABLE IF NOT EXISTS bill_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_id INTEGER,
      item_id INTEGER,
      name TEXT,
      quantity INTEGER,
      price REAL,
      total REAL,
      FOREIGN KEY (bill_id) REFERENCES bills(id),
      FOREIGN KEY (item_id) REFERENCES menu_items(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Seed Initial Data
  const settingsCount = db.prepare("SELECT COUNT(*) as count FROM settings").get() as { count: number };
  if (settingsCount.count === 0) {
    db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run('pos_password', '1234');
  }
  const tableCount = db.prepare("SELECT COUNT(*) as count FROM tables").get() as { count: number };
  if (tableCount.count === 0) {
    const insertTable = db.prepare("INSERT INTO tables (table_number) VALUES (?)");
    ['Table 1', 'Table 2', 'Table 3', 'Table 4'].forEach(t => insertTable.run(t));
  }

  const menuCount = db.prepare("SELECT COUNT(*) as count FROM menu_items").get() as { count: number };
  // Always re-seed menu if it doesn't match our expected count or just to be safe for this request
  // We will clear the existing menu and insert the new one as requested
  db.prepare("DELETE FROM menu_items").run();
  
  const insertMenu = db.prepare("INSERT INTO menu_items (name, category, price, is_veg) VALUES (?, ?, ?, ?)");
  const items = [
    // SOUPS
    ['VEG CORN SOUP', 'Soups', 92, 1],
    ['VEG MANCHOW SOUP', 'Soups', 92, 1],
    ['VEG HOT & SOUR SOUP', 'Soups', 92, 1],
    ['VEG CORIANDER SOUP', 'Soups', 109, 1],
    ['LEMON CORIANDER SOUP', 'Soups', 109, 1],
    ['CHICKEN CORN SOUP', 'Soups', 119, 0],
    ['CHICKEN MANCHOW SOUP', 'Soups', 119, 0],
    ['CHICKEN HOT & SOUR SOUP', 'Soups', 119, 0],
    ['CHICKEN CORIANDER SOUP', 'Soups', 129, 0],
    ['MUTTON BONE SOUP', 'Soups', 179, 0],
    ['MUTTON PAYA SOUP', 'Soups', 179, 0],

    // NON-VEG STARTERS
    ['CHICKEN MANCHURIAN', 'Non-Veg Starters', 259, 0],
    ['CHILLI CHICKEN', 'Non-Veg Starters', 259, 0],
    ['CHICKEN 65', 'Non-Veg Starters', 259, 0],
    ['CHICKEN MAJESTIC', 'Non-Veg Starters', 259, 0],
    ['GUNTUR CHICKEN PAKODA', 'Non-Veg Starters', 369, 0],
    ['RAJU GARI KODI VEPUDU', 'Non-Veg Starters', 369, 0],
    ['BONELESS CHICKEN VEPUDU', 'Non-Veg Starters', 369, 0],
    ['RAJU GARI CHILLI CHICKEN', 'Non-Veg Starters', 369, 0],
    ['RAJU GARI KODI KEBAB (8 PCS)', 'Non-Veg Starters', 359, 0],
    ['TANGDI KEBAB (4 PCS)', 'Non-Veg Starters', 385, 0],
    ['APOLLO FISH', 'Non-Veg Starters', 359, 0],
    ['CHILLI FISH', 'Non-Veg Starters', 359, 0],
    ['CHILLI PRAWNS', 'Non-Veg Starters', 359, 0],
    ['LOOSE PRAWNS', 'Non-Veg Starters', 359, 0],
    ['RAJU GARI CHICKEN PAKODA', 'Non-Veg Starters', 349, 0],
    ['BHEEMMAVARAM KAJU CHICKEN FRY', 'Non-Veg Starters', 349, 0],
    ['RAJU GARI ROYYALA VEPUDU', 'Non-Veg Starters', 389, 0],
    ['CHAPALA GATTI VEPUDU', 'Non-Veg Starters', 389, 0],
    ['RAJU GARI MUTTON VEPUDU', 'Non-Veg Starters', 409, 0],

    // VEG STARTERS
    ['PANEER MANCHURIAN', 'Veg Starters', 199, 1],
    ['PANEER 65', 'Veg Starters', 199, 1],
    ['PANEER MAJESTIC', 'Veg Starters', 199, 1],
    ['CHILLI PANEER', 'Veg Starters', 199, 1],
    ['MUSHROOM MANCHURIAN', 'Veg Starters', 199, 1],
    ['MUSHROOM 65', 'Veg Starters', 199, 1],
    ['CRISPY CORN', 'Veg Starters', 199, 1],
    ['VEG MANGOLIA', 'Veg Starters', 209, 1],
    ['BABY CORN CHILLI', 'Veg Starters', 209, 1],
    ['BABY CORN 65', 'Veg Starters', 209, 1],
    ['GOBI MANCHURIAN', 'Veg Starters', 209, 1],
    ['GOBI 65', 'Veg Starters', 229, 1],
    ['VEG MANCHURIAN', 'Veg Starters', 157, 1],

    // CURRIES
    ['DAL FRY', 'Curries', 149, 1],
    ['DAL TADKA', 'Curries', 149, 1],
    ['PANEER BUTTER MASALA', 'Curries', 219, 1],
    ['PALAK PANEER', 'Curries', 219, 1],
    ['METHI CHAMAN', 'Curries', 219, 1],
    ['MIXED VEG', 'Curries', 219, 1],
    ['KADAI VEG MASALA', 'Curries', 219, 1],
    ['MUSHROOM MASALA', 'Curries', 259, 1],
    ['BABY CORN MASALA', 'Curries', 259, 1],
    ['KAJU CURRY', 'Curries', 219, 1],
    ['BUTTER CHICKEN', 'Curries', 259, 0],
    ['KADAI CHICKEN', 'Curries', 259, 0],
    ['CHICKEN CURRY', 'Curries', 259, 0],
    ['METHI CHICKEN', 'Curries', 259, 0],
    ['CHICKEN MOGHLAI', 'Curries', 259, 0],
    ['FISH CURRY', 'Curries', 359, 0],
    ['PRAWNS CURRY', 'Curries', 359, 0],
    ['EGG CURRY', 'Curries', 149, 0],

    // INDIAN BREADS
    ['ROTI', 'Indian Breads', 30, 1],
    ['BUTTER ROTI', 'Indian Breads', 35, 1],
    ['PLAIN ROTI', 'Indian Breads', 35, 1],
    ['PULKHA', 'Indian Breads', 15, 1],
    ['RUMALI ROTI', 'Indian Breads', 30, 1],
    ['PLAIN NAAN', 'Indian Breads', 40, 1],
    ['BUTTER NAAN', 'Indian Breads', 40, 1],

    // FRIED RICE
    ['VEG FRIED RICE', 'Fried Rice', 119, 1],
    ['EGG FRIED RICE', 'Fried Rice', 119, 0],
    ['CHICKEN FRIED RICE', 'Fried Rice', 169, 0],
    ['PANEER FRIED RICE', 'Fried Rice', 149, 1],
    ['DOUBLE EGG CHICKEN FRIED RICE', 'Fried Rice', 189, 0],
    ['DOUBLE CHICKEN FRIED RICE', 'Fried Rice', 199, 0],
    ['MIX FRIED RICE (VEG)', 'Fried Rice', 189, 1],
    ['MIX FRIED RICE (NON-VEG)', 'Fried Rice', 219, 0],

    // RAJU GARI PULAO’S
    ['RAJU GARI KODI PULAO', "Raju Gari Pulao's", 369, 0],
    ['KONASEEMA KODI PULAO', "Raju Gari Pulao's", 399, 0],
    ['PADDAMMA KODI PULAO', "Raju Gari Pulao's", 399, 0],
    ['RAJU MANORI ROYYALA PULAO', "Raju Gari Pulao's", 425, 0],
    ['RAJU GARI TANGDI CHICKEN PULAO', "Raju Gari Pulao's", 399, 0],
    ['PADDAMMA MUTTON PULAO', "Raju Gari Pulao's", 519, 0],
    ['KONASEEMA VEG PULAO', "Raju Gari Pulao's", 299, 1],
    ['RAJU GARI VEG SPECIAL PULAO', "Raju Gari Pulao's", 299, 1],
    ['RAJU GARI PANEER PULAO', "Raju Gari Pulao's", 299, 1],

    // BIRYANI
    ['VEG BIRYANI', 'Biryani', 219, 1],
    ['PANEER BIRYANI', 'Biryani', 290, 1],
    ['MUSHROOM BIRYANI', 'Biryani', 290, 1],
    ['CHICKEN DUM BIRYANI', 'Biryani', 219, 0],
    ['FRY PIECE CHICKEN BIRYANI', 'Biryani', 350, 0],
    ['RAJU GARI FRY PIECE BIRYANI', 'Biryani', 359, 0],
    ['RAJU GARI BONELESS BIRYANI', 'Biryani', 415, 0],
    ['RAJU GARI POTLAM BIRYANI', 'Biryani', 289, 0],
    ['FISH BIRYANI', 'Biryani', 369, 0],
    ['PRAWNS BIRYANI', 'Biryani', 369, 0],
    ['MUTTON FRY PIECE BIRYANI', 'Biryani', 449, 0],
    ['NALLI POTLAM BIRYANI', 'Biryani', 519, 0],

    // DESSERTS
    ['Apricot Delight', 'Desserts', 119, 1],
    ['Venilla With Kurbana', 'Desserts', 79, 1],
    ['Venilla With Gulab Jamun', 'Desserts', 119, 1],

    // BEVERAGES
    ['Water Bottle', 'Beverages', 20, 1],
    ['Thums Up', 'Beverages', 20, 1],
    ['Coke', 'Beverages', 20, 1],
    ['Sprite', 'Beverages', 20, 1],
    ['Limca', 'Beverages', 20, 1],
    ['Maaza', 'Beverages', 20, 1],
    ['Coke Tin', 'Beverages', 40, 1],
    ['Thums Up Tin', 'Beverages', 40, 1],
  ];
  items.forEach(item => insertMenu.run(...item));
} catch (error) {
  console.error("Database initialization failed:", error);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API Routes
  app.get("/api/tables", (req, res) => {
    const tables = db.prepare("SELECT * FROM tables").all();
    res.json(tables);
  });

  app.get("/api/menu", (req, res) => {
    const menu = db.prepare("SELECT * FROM menu_items").all();
    res.json(menu);
  });

  app.post("/api/tables", (req, res) => {
    const { table_number } = req.body;
    try {
      const info = db.prepare("INSERT INTO tables (table_number) VALUES (?)").run(table_number);
      res.json({ id: info.lastInsertRowid, table_number, status: 'AVAILABLE' });
    } catch (error) {
      res.status(400).json({ error: "Table number already exists" });
    }
  });

  app.delete("/api/tables/:id", (req, res) => {
    db.prepare("DELETE FROM tables WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/menu", (req, res) => {
    const { name, category, price, is_veg } = req.body;
    const info = db.prepare("INSERT INTO menu_items (name, category, price, is_veg) VALUES (?, ?, ?, ?)")
      .run(name, category, price, is_veg || 1);
    res.json({ id: info.lastInsertRowid, name, category, price, is_veg: is_veg || 1 });
  });

  app.get("/api/settings/password", (req, res) => {
    const row = db.prepare("SELECT value FROM settings WHERE key = 'pos_password'").get() as { value: string };
    res.json({ password: row.value });
  });

  app.post("/api/settings/password", (req, res) => {
    const { password } = req.body;
    db.prepare("UPDATE settings SET value = ? WHERE key = 'pos_password'").run(password);
    res.json({ success: true });
  });

  app.post("/api/bills/create", (req, res) => {
    const { table_id } = req.body;
    
    // Check if there's already an open bill for this table
    const existingBill = db.prepare("SELECT id FROM bills WHERE table_id = ? AND status = 'OPEN'").get(table_id) as { id: number } | undefined;
    
    if (existingBill) {
      return res.json({ bill_id: existingBill.id });
    }

    const info = db.prepare("INSERT INTO bills (table_id) VALUES (?)").run(table_id);
    db.prepare("UPDATE tables SET status = 'OCCUPIED' WHERE id = ?").run(table_id);
    res.json({ bill_id: info.lastInsertRowid });
  });

  app.get("/api/bills/:id", (req, res) => {
    const bill = db.prepare("SELECT * FROM bills WHERE id = ?").get(req.params.id);
    const items = db.prepare("SELECT * FROM bill_items WHERE bill_id = ?").all(req.params.id);
    res.json({ ...bill, items });
  });

  app.post("/api/bills/:id/items", (req, res) => {
    const { item_id, name, quantity, price } = req.body;
    const bill_id = req.params.id;
    
    const existingItem = db.prepare("SELECT id, quantity FROM bill_items WHERE bill_id = ? AND item_id = ?")
      .get(bill_id, item_id) as { id: number, quantity: number } | undefined;

    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      db.prepare("UPDATE bill_items SET quantity = ?, total = ? WHERE id = ?")
        .run(newQty, newQty * price, existingItem.id);
    } else {
      db.prepare("INSERT INTO bill_items (bill_id, item_id, name, quantity, price, total) VALUES (?, ?, ?, ?, ?, ?)")
        .run(bill_id, item_id, name, quantity, price, quantity * price);
    }

    // Update bill totals
    const totals = db.prepare("SELECT SUM(total) as subtotal FROM bill_items WHERE bill_id = ?").get(bill_id) as { subtotal: number };
    db.prepare("UPDATE bills SET subtotal = ? WHERE id = ?").run(totals.subtotal || 0, bill_id);

    res.json({ success: true });
  });

  app.put("/api/bills/:id/items/:itemId", (req, res) => {
    const { quantity } = req.body;
    const { id, itemId } = req.params;

    if (quantity <= 0) {
      db.prepare("DELETE FROM bill_items WHERE id = ?").run(itemId);
    } else {
      const item = db.prepare("SELECT price FROM bill_items WHERE id = ?").get(itemId) as { price: number };
      db.prepare("UPDATE bill_items SET quantity = ?, total = ? WHERE id = ?")
        .run(quantity, quantity * item.price, itemId);
    }

    const totals = db.prepare("SELECT SUM(total) as subtotal FROM bill_items WHERE bill_id = ?").get(id) as { subtotal: number };
    db.prepare("UPDATE bills SET subtotal = ? WHERE id = ?").run(totals.subtotal || 0, id);
    
    res.json({ success: true });
  });

  app.post("/api/bills/:id/close", (req, res) => {
    const { discount_percent, order_type } = req.body;
    const bill_id = req.params.id;

    const bill = db.prepare("SELECT subtotal, table_id FROM bills WHERE id = ?").get(bill_id) as { subtotal: number, table_id: number };
    const discount = (bill.subtotal * (discount_percent || 0)) / 100;
    const taxableAmount = bill.subtotal - discount;
    const tax = taxableAmount * 0.05;
    const grand_total = taxableAmount + tax;

    db.prepare(`
      UPDATE bills 
      SET discount = ?, tax = ?, grand_total = ?, order_type = ?, status = 'CLOSED' 
      WHERE id = ?
    `).run(discount, tax, grand_total, order_type, bill_id);

    db.prepare("UPDATE tables SET status = 'AVAILABLE' WHERE id = ?").run(bill.table_id);

    res.json({ success: true });
  });

  app.get("/api/revenue/today", (req, res) => {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_bills,
        SUM(grand_total) as total_revenue,
        SUM(tax) as total_tax
      FROM bills 
      WHERE status = 'CLOSED' AND date(created_at, 'localtime') = date('now', 'localtime')
    `).get();

    const bills = db.prepare(`
      SELECT b.*, t.table_number 
      FROM bills b 
      JOIN tables t ON b.table_id = t.id 
      WHERE b.status = 'CLOSED' AND date(b.created_at, 'localtime') = date('now', 'localtime')
      ORDER BY b.created_at DESC
    `).all();

    res.json({ stats, bills });
  });

  app.get("/api/revenue/history", (req, res) => {
    const bills = db.prepare(`
      SELECT b.*, t.table_number 
      FROM bills b 
      JOIN tables t ON b.table_id = t.id 
      WHERE b.status = 'CLOSED'
      ORDER BY b.created_at DESC
    `).all();
    res.json(bills);
  });

  app.get("/api/revenue/analytics/daily", (req, res) => {
    const data = db.prepare(`
      SELECT 
        date(created_at) as date, 
        SUM(grand_total) as total 
      FROM bills 
      WHERE status = 'CLOSED' 
      GROUP BY date(created_at) 
      ORDER BY date(created_at) DESC 
      LIMIT 30
    `).all();
    res.json(data.reverse()); // Send in chronological order
  });

  app.get("/api/revenue/analytics/monthly", (req, res) => {
    const data = db.prepare(`
      SELECT 
        strftime('%Y-%m', created_at) as month, 
        SUM(grand_total) as total 
      FROM bills 
      WHERE status = 'CLOSED' 
      GROUP BY strftime('%Y-%m', created_at) 
      ORDER BY strftime('%Y-%m', created_at) DESC 
      LIMIT 12
    `).all();
    res.json(data.reverse()); // Send in chronological order
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
