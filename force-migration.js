import { runMigrations } from './server/migrate.js';

console.log('Forcing database migrations to create delivery tracking tables...');

runMigrations()
  .then(() => {
    console.log('✅ Database migrations completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });