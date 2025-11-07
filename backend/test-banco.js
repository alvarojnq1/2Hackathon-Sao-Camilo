import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ⚠️ CORRIGIDO: Lê o .env da RAIZ do projeto
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') }); // ← '..' volta uma pasta

console.log('🧪 INICIANDO TESTE DO BANCO DE DADOS...\n');
console.log('📁 Lendo .env de:', path.join(__dirname, '..', '.env'));

async function testarBanco() {
  try {
    // Teste 1: Variáveis de ambiente
    console.log('1. 🔧 Variáveis de ambiente:');
    console.log('   DB_HOST:', process.env.DB_HOST);
    console.log('   DB_USER:', process.env.DB_USER);
    console.log('   DB_NAME:', process.env.DB_NAME);
    console.log('   DB_PASSWORD:', process.env.DB_PASSWORD ? '✅ Definida' : '❌ Indefinida');

    if (!process.env.DB_HOST || !process.env.DB_USER) {
      console.log('   ❌ Variáveis não carregadas - verifique o caminho do .env');
      return;
    }

    // Teste 2: Conexão com MySQL
    console.log('\n2. 🔌 Testando conexão com MySQL...');
    const mysql = await import('mysql2/promise');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    console.log('   ✅ Conexão estabelecida com sucesso!');

    // Resto do teste continua igual...
    console.log('\n3. 📊 Verificando tabelas...');
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ?
    `, [process.env.DB_NAME]);

    console.log('   Tabelas encontradas:');
    tables.forEach(table => {
      console.log(`   - ${table.TABLE_NAME}`);
    });

    await connection.end();
    console.log('\n🎉 BANCO DE DADOS FUNCIONANDO PERFEITAMENTE!');

  } catch (error) {
    console.log('\n❌ ERRO NO BANCO DE DADOS:');
    console.log('   Mensagem:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('   🔐 Problema: Credenciais incorretas - verifique DB_PASSWORD no .env');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('   📁 Problema: Database não existe');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('   🔌 Problema: MySQL não está rodando');
    }
  }
}

testarBanco();