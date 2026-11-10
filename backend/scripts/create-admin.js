// Da el rol "administrador" a un usuario ya registrado.
// Uso (desde la carpeta backend): npm run admin:create -- correo@ejemplo.com
require('dotenv').config({ quiet: true });

const { pool } = require('../src/config/db');

const email = (process.argv[2] || '').trim().toLowerCase();

(async () => {
  if (!email) {
    console.error('Uso: npm run admin:create -- correo@ejemplo.com');
    process.exitCode = 1;
    return;
  }

  try {
    const usuario = await pool.query(
      'SELECT id_usuario, nombre, apellido FROM usuarios WHERE lower(email) = $1',
      [email]
    );
    if (usuario.rowCount === 0) {
      console.error(`❌ No existe un usuario con el email ${email}. Primero regístralo con POST /api/auth/register.`);
      process.exitCode = 1;
      return;
    }

    const { id_usuario, nombre, apellido } = usuario.rows[0];
    const resultado = await pool.query(
      `INSERT INTO usuario_rol (id_usuario, id_rol)
       SELECT $1, id_rol FROM roles WHERE nombre_rol = 'administrador'
       ON CONFLICT DO NOTHING`,
      [id_usuario]
    );

    if (resultado.rowCount === 0) {
      console.log(`ℹ️  ${nombre} ${apellido} (${email}) ya era administrador.`);
    } else {
      console.log(`✅ ${nombre} ${apellido} (${email}) ahora es administrador.`);
      console.log('   Debe iniciar sesión de nuevo para que su token incluya el nuevo rol.');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
