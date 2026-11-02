import mysql, { type Pool, type RowDataPacket, type ResultSetHeader } from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import type { AdminStats, DashboardStats, Notification, Product, ProductStatus, TransactionType, User } from '../types.js';

let pool: Pool | null = null;

function getPool() {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is required for the managed database');
    pool = mysql.createPool({ uri: url, connectionLimit: 5, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}

export async function initDatabase() {
  const db = getPool();
  const statements = [
    `CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(120) NOT NULL, email VARCHAR(190) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL, role ENUM('STUDENT','ADMIN') NOT NULL DEFAULT 'STUDENT', department VARCHAR(120), student_id VARCHAR(120), profile_image TEXT, account_status ENUM('ACTIVE','SUSPENDED') NOT NULL DEFAULT 'ACTIVE', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS products (id INT AUTO_INCREMENT PRIMARY KEY, seller_id INT NOT NULL, title VARCHAR(180) NOT NULL, description TEXT NOT NULL, category VARCHAR(80) NOT NULL, subject VARCHAR(120) NOT NULL, course VARCHAR(120) NOT NULL, department VARCHAR(120) NOT NULL, semester VARCHAR(40) NOT NULL, author_or_brand VARCHAR(160) NOT NULL, original_price DECIMAL(10,2) NOT NULL, selling_price DECIMAL(10,2) NOT NULL, condition_label VARCHAR(40) NOT NULL, transaction_type ENUM('SALE','EXCHANGE','RENTAL') NOT NULL, campus_location VARCHAR(180) NOT NULL, images_json JSON NOT NULL, status ENUM('PENDING','APPROVED','REJECTED','SUSPENDED') NOT NULL DEFAULT 'PENDING', rejection_reason TEXT, is_active BOOLEAN NOT NULL DEFAULT TRUE, popularity INT NOT NULL DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, INDEX idx_product_status (status,is_active), INDEX idx_product_department (department), CONSTRAINT fk_product_seller FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE)`,
    `CREATE TABLE IF NOT EXISTS wishlist_items (user_id INT NOT NULL, product_id INT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (user_id,product_id), CONSTRAINT fk_wish_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, CONSTRAINT fk_wish_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE)`,
    `CREATE TABLE IF NOT EXISTS notifications (id INT AUTO_INCREMENT PRIMARY KEY, recipient_id INT NOT NULL, title VARCHAR(160) NOT NULL, message TEXT NOT NULL, type VARCHAR(60) NOT NULL, is_read BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_notification_recipient (recipient_id,is_read), CONSTRAINT fk_notification_user FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE)`,
    `CREATE TABLE IF NOT EXISTS orders (id INT AUTO_INCREMENT PRIMARY KEY, buyer_id INT NOT NULL, seller_id INT NOT NULL, product_id INT NOT NULL, amount DECIMAL(10,2) NOT NULL, payment_status ENUM('CREATED','PAID','FAILED') NOT NULL DEFAULT 'CREATED', order_status ENUM('PENDING','CONFIRMED','CANCELLED') NOT NULL DEFAULT 'PENDING', razorpay_order_id VARCHAR(160), razorpay_payment_id VARCHAR(160), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY uq_razorpay_payment (razorpay_payment_id), CONSTRAINT fk_order_buyer FOREIGN KEY (buyer_id) REFERENCES users(id), CONSTRAINT fk_order_seller FOREIGN KEY (seller_id) REFERENCES users(id), CONSTRAINT fk_order_product FOREIGN KEY (product_id) REFERENCES products(id))`,
    `CREATE TABLE IF NOT EXISTS exchange_requests (id INT AUTO_INCREMENT PRIMARY KEY, requester_id INT NOT NULL, recipient_id INT NOT NULL, offered_product_id INT, requested_product_id INT NOT NULL, status ENUM('PENDING','ACCEPTED','REJECTED','COMPLETED') NOT NULL DEFAULT 'PENDING', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, CONSTRAINT fk_exchange_requester FOREIGN KEY (requester_id) REFERENCES users(id), CONSTRAINT fk_exchange_recipient FOREIGN KEY (recipient_id) REFERENCES users(id), CONSTRAINT fk_exchange_offered FOREIGN KEY (offered_product_id) REFERENCES products(id) ON DELETE SET NULL, CONSTRAINT fk_exchange_requested FOREIGN KEY (requested_product_id) REFERENCES products(id))`,
    `CREATE TABLE IF NOT EXISTS rental_requests (id INT AUTO_INCREMENT PRIMARY KEY, requester_id INT NOT NULL, product_id INT NOT NULL, start_date DATE NOT NULL, end_date DATE NOT NULL, rental_amount DECIMAL(10,2) NOT NULL, status ENUM('PENDING','ACCEPTED','REJECTED','COMPLETED') NOT NULL DEFAULT 'PENDING', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, CONSTRAINT fk_rental_requester FOREIGN KEY (requester_id) REFERENCES users(id), CONSTRAINT fk_rental_product FOREIGN KEY (product_id) REFERENCES products(id))`,
    `CREATE TABLE IF NOT EXISTS reports (id INT AUTO_INCREMENT PRIMARY KEY, reporter_id INT NOT NULL, product_id INT NOT NULL, reason VARCHAR(120) NOT NULL, description TEXT, status ENUM('OPEN','REVIEWED','DISMISSED') NOT NULL DEFAULT 'OPEN', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, CONSTRAINT fk_reporter FOREIGN KEY (reporter_id) REFERENCES users(id), CONSTRAINT fk_report_product FOREIGN KEY (product_id) REFERENCES products(id))`,
  ];
  for (const statement of statements) await db.execute(statement);
  await seedDatabase();
}

async function seedDatabase() {
  const db = getPool();
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@campusreuse.local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'CampusReuse!2026';
  const [rows] = await db.query<RowDataPacket[]>('SELECT id FROM users WHERE email = ?', [adminEmail]);
  if (!rows.length) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await db.execute('INSERT INTO users (name,email,password_hash,role,department) VALUES (?,?,?,?,?)', ['Campus Reuse Admin', adminEmail, passwordHash, 'ADMIN', 'Student Affairs']);
  }
  const [productRows] = await db.query<RowDataPacket[]>('SELECT id FROM products LIMIT 1');
  if (!productRows.length) {
    const [demoRows] = await db.query<RowDataPacket[]>('SELECT id FROM users WHERE email=? LIMIT 1', ['aarav.demo@campusreuse.local']);
    let demoId: number;
    if (demoRows.length) demoId = Number(demoRows[0].id);
    else {
      const [demoResult] = await db.execute<ResultSetHeader>('INSERT INTO users (name,email,password_hash,role,department,student_id) VALUES (?,?,?,?,?,?)', ['Aarav Mehta', 'aarav.demo@campusreuse.local', await bcrypt.hash('Student!2026', 12), 'STUDENT', 'Computer Science', 'CR-DEMO-01']);
      demoId = demoResult.insertId;
    }
    const items = [
      ['Operating Systems Concepts', 'Clean, annotated copy with plenty of useful examples. Great for a second-year systems course.', 'Textbooks', 'Operating Systems', 'B.Tech CSE', 'Computer Science', 'Semester 4', 'Silberschatz', 950, 480, 'GOOD', 'SALE', 'North Gate Library', '/assets/book-os.svg'],
      ['Casio fx-991ES Plus', 'Reliable scientific calculator, lightly used and fully functional.', 'Calculators', 'Engineering Mathematics', 'All Engineering', 'Engineering', 'Semester 2', 'Casio', 1600, 850, 'EXCELLENT', 'SALE', 'Main Block Lobby', '/assets/calculator.svg'],
      ['Engineering Drawing Kit', 'Complete drawing instruments set for first-year studio work.', 'Drawing instruments', 'Engineering Drawing', 'B.Arch / B.Tech', 'Mechanical Engineering', 'Semester 1', 'Camlin', 1200, 550, 'GOOD', 'EXCHANGE', 'Design Studio', '/assets/kit.svg'],
      ['Lab Coat — Medium', 'Freshly washed white lab coat, medium size.', 'Lab equipment', 'Laboratory Practice', 'B.Sc Biology', 'Life Sciences', 'Semester 3', 'Campus Issue', 700, 250, 'GOOD', 'RENTAL', 'Science Quadrangle', '/assets/coat.svg'],
      ['Competitive Exam Prep Bundle', 'Curated CAT and aptitude prep books with practice papers.', 'Competitive exams', 'Aptitude', 'Open Elective', 'Management', 'Any semester', 'Arihant', 2200, 900, 'GOOD', 'SALE', 'Student Centre', '/assets/books.svg'],
      ['Mechanical Keyboard', 'Compact USB keyboard for coding and study setups.', 'Electronics', 'Programming Tools', 'Open to all', 'Computer Science', 'Any semester', 'Keychron', 4800, 2850, 'EXCELLENT', 'SALE', 'Innovation Hub', '/assets/keyboard.svg'],
    ];
    for (const item of items) {
      await db.execute('INSERT INTO products (seller_id,title,description,category,subject,course,department,semester,author_or_brand,original_price,selling_price,condition_label,transaction_type,campus_location,images_json,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [demoId, ...item.slice(0, 13), JSON.stringify([item[13]]), 'APPROVED']);
    }
  }
}

function parseProduct(row: RowDataPacket): Product {
  return {
    id: Number(row.id), sellerId: Number(row.seller_id), sellerName: row.seller_name, sellerEmail: row.seller_email,
    title: row.title, description: row.description, category: row.category, subject: row.subject, course: row.course,
    department: row.department, semester: row.semester, authorOrBrand: row.author_or_brand, originalPrice: Number(row.original_price),
    sellingPrice: Number(row.selling_price), condition: row.condition_label, transactionType: row.transaction_type,
    campusLocation: row.campus_location, images: typeof row.images_json === 'string' ? JSON.parse(row.images_json) : (row.images_json || []),
    status: row.status, rejectionReason: row.rejection_reason, isActive: Boolean(row.is_active), popularity: Number(row.popularity || 0),
    createdAt: new Date(row.created_at).toISOString(), updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function parseUser(row: RowDataPacket): User {
  return {
    id: Number(row.id),
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    department: row.department,
    studentId: row.student_id,
    profileImage: row.profile_image,
    accountStatus: row.account_status,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

const productJoin = `SELECT p.*, u.name seller_name, u.email seller_email FROM products p JOIN users u ON u.id=p.seller_id`;

export async function findUserByEmail(email: string) {
  const [rows] = await getPool().query<RowDataPacket[]>('SELECT * FROM users WHERE email=? LIMIT 1', [email.toLowerCase()]);
  return rows[0] ? parseUser(rows[0]) : undefined;
}
export async function findUserById(id: number) {
  const [rows] = await getPool().query<RowDataPacket[]>('SELECT id,name,email,password_hash,role,department,student_id,profile_image,account_status,created_at FROM users WHERE id=? LIMIT 1', [id]);
  return rows[0] ? parseUser(rows[0]) : undefined;
}
export async function createUser(input: { name: string; email: string; passwordHash: string; department: string; studentId: string }) {
  const [result] = await getPool().execute<ResultSetHeader>('INSERT INTO users (name,email,password_hash,department,student_id) VALUES (?,?,?,?,?)', [input.name, input.email.toLowerCase(), input.passwordHash, input.department, input.studentId]);
  return findUserById(result.insertId);
}
export async function updateUser(id: number, input: { name?: string; department?: string; studentId?: string; profileImage?: string }) {
  const fields: string[] = []; const values: (string | number)[] = [];
  for (const [key, column] of [['name','name'], ['department','department'], ['studentId','student_id'], ['profileImage','profile_image']] as const) if (input[key]) { fields.push(`${column}=?`); values.push(input[key]); }
  if (!fields.length) return findUserById(id);
  values.push(id); await getPool().execute(`UPDATE users SET ${fields.join(',')} WHERE id=?`, values); return findUserById(id);
}
export async function updatePassword(id: number, passwordHash: string) { await getPool().execute('UPDATE users SET password_hash=? WHERE id=?', [passwordHash, id]); }

export async function listProducts(filters: { search?: string; category?: string; department?: string; semester?: string; condition?: string; transactionType?: string; minPrice?: number; maxPrice?: number; sort?: string; page?: number; limit?: number; mine?: number; status?: string }) {
  const where: string[] = []; const params: unknown[] = [];
  if (filters.mine) { where.push('p.seller_id=?'); params.push(filters.mine); } else { where.push('p.status=\'APPROVED\' AND p.is_active=TRUE'); }
  if (filters.status) { where.push('p.status=?'); params.push(filters.status); }
  if (filters.search) { where.push('(p.title LIKE ? OR p.author_or_brand LIKE ? OR p.subject LIKE ? OR p.course LIKE ? OR p.department LIKE ?)'); const q = `%${filters.search}%`; params.push(q,q,q,q,q); }
  const pairs: [keyof typeof filters, string][] = [['category','p.category'],['department','p.department'],['semester','p.semester'],['condition','p.condition_label'],['transactionType','p.transaction_type']];
  for (const [key, column] of pairs) if (filters[key]) { where.push(`${column}=?`); params.push(filters[key]); }
  if (filters.minPrice !== undefined) { where.push('p.selling_price>=?'); params.push(filters.minPrice); }
  if (filters.maxPrice !== undefined) { where.push('p.selling_price<=?'); params.push(filters.maxPrice); }
  const order = ({ price_asc:'p.selling_price ASC', price_desc:'p.selling_price DESC', oldest:'p.created_at ASC', popular:'p.popularity DESC', recent:'p.created_at DESC' } as Record<string,string>)[filters.sort || 'recent'] || 'p.created_at DESC';
  const page = Math.max(1, filters.page || 1); const limit = Math.min(24, Math.max(1, filters.limit || 12));
  const [countRows] = await getPool().query<RowDataPacket[]>(`SELECT COUNT(*) count FROM products p WHERE ${where.join(' AND ')}`, params);
  const [rows] = await getPool().query<RowDataPacket[]>(`${productJoin} WHERE ${where.join(' AND ')} ORDER BY ${order} LIMIT ? OFFSET ?`, [...params, limit, (page-1)*limit]);
  return { items: rows.map(parseProduct), total: Number(countRows[0].count), page, limit };
}
export async function getProduct(id: number) {
  const [rows] = await getPool().query<RowDataPacket[]>(`${productJoin} WHERE p.id=? LIMIT 1`, [id]);
  if (!rows[0]) return undefined; await getPool().execute('UPDATE products SET popularity=popularity+1 WHERE id=?', [id]); return parseProduct(rows[0]);
}
export async function createProduct(input: Omit<Product,'id'|'sellerName'|'sellerEmail'|'status'|'rejectionReason'|'isActive'|'popularity'|'createdAt'|'updatedAt'>) {
  const [result] = await getPool().execute<ResultSetHeader>('INSERT INTO products (seller_id,title,description,category,subject,course,department,semester,author_or_brand,original_price,selling_price,condition_label,transaction_type,campus_location,images_json,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,\'PENDING\')', [input.sellerId,input.title,input.description,input.category,input.subject,input.course,input.department,input.semester,input.authorOrBrand,input.originalPrice,input.sellingPrice,input.condition,input.transactionType,input.campusLocation,JSON.stringify(input.images)]);
  return getProduct(result.insertId);
}
export async function updateProductStatus(id: number, status: ProductStatus, reason?: string) { await getPool().execute('UPDATE products SET status=?, rejection_reason=?, is_active=? WHERE id=?', [status, reason || null, status === 'APPROVED', id]); return getProduct(id); }
export async function deleteProduct(id: number) { await getPool().execute('DELETE FROM products WHERE id=?', [id]); }

export async function getWishlist(userId: number) { const [rows] = await getPool().query<RowDataPacket[]>(`${productJoin} JOIN wishlist_items w ON w.product_id=p.id WHERE w.user_id=? ORDER BY w.created_at DESC`, [userId]); return rows.map(parseProduct); }
export async function toggleWishlist(userId: number, productId: number) { const [rows] = await getPool().query<RowDataPacket[]>('SELECT product_id FROM wishlist_items WHERE user_id=? AND product_id=?', [userId,productId]); if (rows.length) { await getPool().execute('DELETE FROM wishlist_items WHERE user_id=? AND product_id=?',[userId,productId]); return false; } await getPool().execute('INSERT INTO wishlist_items (user_id,product_id) VALUES (?,?)',[userId,productId]); return true; }

export async function addNotification(recipientId: number, title: string, message: string, type: string) { await getPool().execute('INSERT INTO notifications (recipient_id,title,message,type) VALUES (?,?,?,?)',[recipientId,title,message,type]); }
export async function listNotifications(userId: number) { const [rows] = await getPool().query<RowDataPacket[]>('SELECT id,recipient_id,title,message,type,is_read,created_at FROM notifications WHERE recipient_id=? ORDER BY created_at DESC LIMIT 30',[userId]); return rows.map((r) => ({ id:Number(r.id), recipientId:Number(r.recipient_id), title:r.title, message:r.message, type:r.type, read:Boolean(r.is_read), createdAt:new Date(r.created_at).toISOString() })) as Notification[]; }
export async function markNotificationsRead(userId: number) { await getPool().execute('UPDATE notifications SET is_read=TRUE WHERE recipient_id=?',[userId]); }

export async function getStudentDashboard(userId: number): Promise<DashboardStats> {
  const [listing] = await getPool().query<RowDataPacket[]>(`SELECT COUNT(*) total, SUM(status='APPROVED' AND is_active=TRUE) active, SUM(status='PENDING') pending, SUM(status='REJECTED') rejected FROM products WHERE seller_id=?`,[userId]);
  const [purchases] = await getPool().query<RowDataPacket[]>('SELECT COUNT(*) count FROM orders WHERE buyer_id=? AND payment_status=\'PAID\'',[userId]);
  const [sales] = await getPool().query<RowDataPacket[]>('SELECT COUNT(*) count FROM orders WHERE seller_id=? AND payment_status=\'PAID\'',[userId]);
  const row=listing[0] || {}; return { totalListings:Number(row.total||0), activeListings:Number(row.active||0), pendingListings:Number(row.pending||0), rejectedListings:Number(row.rejected||0), totalPurchases:Number(purchases[0]?.count||0), totalSales:Number(sales[0]?.count||0) };
}
export async function getAdminDashboard(): Promise<AdminStats> {
  const db=getPool(); const one=async(sql:string,params:unknown[]=[])=>(await db.query<RowDataPacket[]>(sql,params))[0][0] || {};
  const students=await one("SELECT COUNT(*) count FROM users WHERE role='STUDENT'"); const listings=await one('SELECT COUNT(*) count FROM products'); const pending=await one("SELECT COUNT(*) count FROM products WHERE status='PENDING'"); const approved=await one("SELECT COUNT(*) count FROM products WHERE status='APPROVED'"); const rejected=await one("SELECT COUNT(*) count FROM products WHERE status='REJECTED'"); const transactions=await one("SELECT COUNT(*) count FROM orders WHERE payment_status='PAID'"); const sales=await one("SELECT COALESCE(SUM(amount),0) total FROM orders WHERE payment_status='PAID'");
  const [monthlyReg]=await db.query<RowDataPacket[]>("SELECT DATE_FORMAT(created_at,'%b') label, COUNT(*) value FROM users WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH) GROUP BY YEAR(created_at), MONTH(created_at), DATE_FORMAT(created_at,'%b') ORDER BY YEAR(created_at), MONTH(created_at)");
  const [monthlyList]=await db.query<RowDataPacket[]>("SELECT DATE_FORMAT(created_at,'%b') label, COUNT(*) value FROM products WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH) GROUP BY YEAR(created_at), MONTH(created_at), DATE_FORMAT(created_at,'%b') ORDER BY YEAR(created_at), MONTH(created_at)");
  const [cats]=await db.query<RowDataPacket[]>('SELECT category label, COUNT(*) value FROM products GROUP BY category ORDER BY value DESC');
  return { totalStudents:Number(students.count||0), totalListings:Number(listings.count||0), pendingListings:Number(pending.count||0), approvedListings:Number(approved.count||0), rejectedListings:Number(rejected.count||0), totalTransactions:Number(transactions.count||0), totalSalesValue:Number(sales.total||0), monthlyRegistrations:monthlyReg.map((r)=>({label:r.label,value:Number(r.value)})), monthlyListings:monthlyList.map((r)=>({label:r.label,value:Number(r.value)})), categoryDistribution:cats.map((r)=>({label:r.label,value:Number(r.value)})) };
}
export async function listUsers(search?: string) { const params: unknown[]=[]; let sql="SELECT id,name,email,role,department,student_id,account_status,created_at FROM users"; if(search){sql+=' WHERE name LIKE ? OR email LIKE ?'; const q=`%${search}%`; params.push(q,q);} sql+=' ORDER BY created_at DESC LIMIT 100'; const [rows]=await getPool().query<RowDataPacket[]>(sql,params); return rows; }
export async function setUserStatus(id:number,status:'ACTIVE'|'SUSPENDED'){await getPool().execute('UPDATE users SET account_status=? WHERE id=?',[status,id]); return findUserById(id);}
export async function createOrder(buyerId:number, productId:number) { const product=await getProduct(productId); if(!product || product.status!=='APPROVED' || !product.isActive) throw new Error('This listing is no longer available'); const [result]=await getPool().execute<ResultSetHeader>('INSERT INTO orders (buyer_id,seller_id,product_id,amount) VALUES (?,?,?,?)',[buyerId,product.sellerId,product.id,product.sellingPrice]); return { id:result.insertId, product };
}
export async function attachRazorpayOrder(orderId:number, razorpayOrderId:string){await getPool().execute('UPDATE orders SET razorpay_order_id=? WHERE id=?',[razorpayOrderId,orderId]);}
export async function findOrder(orderId:number){const [rows]=await getPool().query<RowDataPacket[]>('SELECT * FROM orders WHERE id=? LIMIT 1',[orderId]);return rows[0];}
export async function recordPaidOrder(orderId:number,paymentId:string){await getPool().execute("UPDATE orders SET payment_status='PAID', order_status='CONFIRMED', razorpay_payment_id=? WHERE id=?",[paymentId,orderId]);}
export async function createExchange(requesterId:number,requestedProductId:number,offeredProductId?:number){const product=await getProduct(requestedProductId);if(!product) throw new Error('Requested listing not found'); const [r]=await getPool().execute<ResultSetHeader>('INSERT INTO exchange_requests (requester_id,recipient_id,offered_product_id,requested_product_id) VALUES (?,?,?,?)',[requesterId,product.sellerId,offeredProductId||null,requestedProductId]);await addNotification(product.sellerId,'New exchange request',`Someone is interested in exchanging for ${product.title}.`,'EXCHANGE');return r.insertId;}
export async function createRental(requesterId:number,productId:number,startDate:string,endDate:string,rentalAmount:number){const product=await getProduct(productId);if(!product) throw new Error('Listing not found'); const [r]=await getPool().execute<ResultSetHeader>('INSERT INTO rental_requests (requester_id,product_id,start_date,end_date,rental_amount) VALUES (?,?,?,?,?)',[requesterId,productId,startDate,endDate,rentalAmount]);await addNotification(product.sellerId,'New rental request',`A student requested to rent ${product.title}.`,'RENTAL');return r.insertId;}
export async function listExchangeRequests(userId:number){const [rows]=await getPool().query<RowDataPacket[]>('SELECT e.*,p.title requester_product_title FROM exchange_requests e JOIN products p ON p.id=e.requested_product_id WHERE e.requester_id=? OR e.recipient_id=? ORDER BY e.created_at DESC',[userId,userId]);return rows;}
export async function updateExchangeStatus(id:number,status:'ACCEPTED'|'REJECTED'|'COMPLETED'){await getPool().execute('UPDATE exchange_requests SET status=? WHERE id=?',[status,id]);}
export async function listRentalRequests(userId:number){const [rows]=await getPool().query<RowDataPacket[]>('SELECT r.*,p.title FROM rental_requests r JOIN products p ON p.id=r.product_id JOIN users u ON u.id=p.seller_id WHERE r.requester_id=? OR u.id=? ORDER BY r.created_at DESC',[userId,userId]);return rows;}
export async function updateRentalStatus(id:number,status:'ACCEPTED'|'REJECTED'|'COMPLETED'){await getPool().execute('UPDATE rental_requests SET status=? WHERE id=?',[status,id]);}
export async function reportProduct(reporterId:number,productId:number,reason:string,description:string){await getPool().execute('INSERT INTO reports (reporter_id,product_id,reason,description) VALUES (?,?,?,?)',[reporterId,productId,reason,description]);}
export async function listOrders(userId:number){const [rows]=await getPool().query<RowDataPacket[]>(`SELECT o.*,p.title,p.images_json,u.name seller_name FROM orders o JOIN products p ON p.id=o.product_id JOIN users u ON u.id=o.seller_id WHERE o.buyer_id=? OR o.seller_id=? ORDER BY o.created_at DESC LIMIT 50`,[userId,userId]);return rows;}
export async function listAdminProducts(status?:string){const [rows]=await getPool().query<RowDataPacket[]>(`${productJoin} ${status? 'WHERE p.status=?':''} ORDER BY p.created_at DESC LIMIT 100`,status?[status]:[]);return rows.map(parseProduct);}
