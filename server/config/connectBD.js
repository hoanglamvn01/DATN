import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config(); 

export const db = mysql.createConnection({

  host: 'localhost',
  user: 'root',
  password: '', 
  database: 'datn2025',
  port: 3306,
    waitForConnections: true,
    connectionLimit: 10, // Số kết nối tối đa trong pool
    queueLimit: 0
})


export const queryDatabase = (sql, values = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, values, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};