// Prueba la conexión a la base de datos sin levantar el servidor.
// Uso: npm run db:test  (desde la carpeta backend)
require('dotenv').config();

const { pool } = require('../src/config/db');

(async () => {
  try {
    const { rows } = await pool.query(
      'SELECT current_database() AS db, current_user AS usuario, version() AS version'
    );
    console.log('✅ Conexión exitosa');
    console.log(`   Base de datos: ${rows[0].db}`);
    console.log(`   Usuario:       ${rows[0].usuario}`);
    console.log(`   Servidor:      ${rows[0].version.split(',')[0]}`);

    const tablas = await pool.query(
      `SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' ORDER BY table_name`
    );
    if (tablas.rows.length === 0) {
      console.log('⚠️  No hay tablas en el esquema public. ¿Ya ejecutaste database/skillswap_schema_supabase.sql?');
    } else {
      console.log(`   Tablas en public (${tablas.rows.length}): ${tablas.rows.map((t) => t.table_name).join(', ')}`);
    }
  } catch (err) {
    console.error('❌ No se pudo conectar:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
