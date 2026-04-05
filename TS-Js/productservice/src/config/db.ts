import { Sequelize } from "sequelize";

export const sequelize = new Sequelize(
  "postgres",     // database (same as in your tool)
  "postgres",     // username
  "root", // put the same password you use in the UI
  {
    host: "localhost",
    port: 5432,
    dialect: "postgres",
    logging: false,

    pool: {
      max: 5,
      min: 1,
      acquire: 30000,
      idle: 10000,
      evict: 10000,
    },

    dialectOptions: {
      statement_timeout: 60000,
      idle_in_transaction_session_timeout: 30000,
    },

    define: {
      timestamps: true,
    },
  }
);

export async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log("PostgreSQL connected 🐘");
  } catch (err) {
    console.error("DB connection failed:", err);
   throw err;

  }
}
