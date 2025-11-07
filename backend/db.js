import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Configurar caminhos para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar .env da pasta raiz
dotenv.config({ path: path.join(__dirname, '..', '.env') });

console.log('🔌 Configurando pool MySQL...');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PASSWORD length:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 'undefined');

// Configuração com fallbacks
const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'genetica_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

console.log('🔧 Configuração MySQL:', {
  host: config.host,
  user: config.user,
  database: config.database,
  passwordLength: config.password ? config.password.length : 0
});

const pool = mysql.createPool(config);

// Teste de conexão ao inicializar
pool.getConnection()
  .then(connection => {
    console.log('✅ Conexão com MySQL estabelecida com sucesso!');
    connection.release();
  })
  .catch(error => {
    console.error('❌ Erro ao conectar com MySQL:', error.message);
  });

export default pool;