import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import "dotenv/config";
import { Pool } from "pg";
import config from "./config";

const app: Application = express();
const port = process.env.PORT || 5000;
const pool = new Pool({
  connectionString: config.connection_string as string,
});
console.log(pool);

const intDB = async () => {
  try {
    await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255),
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      age INT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
    console.log("DataBase Created");
  } catch (error) {
    console.log(error);
  }
};

app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));

intDB();

app.get("/", (req: Request, res: Response) => {
  //   console.log(req);
  res.status(200).json({
    success: true,
    message: "This is route",
    author: "PH",
  });
});

app.post("/api/v1/users", async (req: Request, res: Response) => {
  try {
    //   console.log(req.body);
    const { name, email, password, age } = req.body;
    const result = await pool.query(
      `
        INSERT INTO users (name, email, password, age) VALUES ($1,$2,$3,$4) RETURNING *
    `,
      [name, email, password, age],
    );
    //   console.log(result);
    res.status(201).json({
      success: true,
      message: "User Created",
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message,
      error: error,
    });
  }
});

app.get("/api/v1/users", async (req: Request, res: Response) => {
  //   console.log(req);
  try {
    const result = await pool.query(`
            SELECT * FROM users
    `);
    res.status(201).json({
      success: true,
      message: "User Retrived Successfully",
      data: result.rows,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message,
      error: error,
    });
  }
});
app.get("/api/v1/users/:id", async (req: Request, res: Response) => {
  //   console.log(req);
  try {
    const { id } = req.params;
    const result = await pool.query(
      `
        SELECT * FROM users WHERE id=$1
    `,
      [id],
    );
    if (result.rowCount === 0) {
      res.status(404).json({
        success: false,
        message: "User Not Found",
      });
    }
    res.status(201).json({
      success: true,
      message: "User Retrived Successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message,
      error: error,
    });
  }
});

app.put("/api/v1/users/:id", async (req: Request, res: Response) => {
  //   console.log(req);
  try {
    const { id } = req.params;
    const { name, password, age, is_active } = req.params;
    const result = await pool.query(
      `
        UPDATE users 
        SET
        name = COALESCE($1, name),
        password = COALESCE($2, password),
        age = COALESCE($3, age),
        is_active = COALESCE($4, is_active),
        updated_at = NOW()
        WHERE id=$5 RETURNING *
    `,
      [name ?? null, password ?? null, age ?? null, is_active ?? null, id],
    );
    if (result.rowCount === 0) {
      res.status(404).json({
        success: false,
        message: "User Not Found",
      });
    }
    res.status(201).json({
      success: true,
      message: "User Updated Successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message,
      error: error,
    });
  }
});
app.delete("/api/v1/users/:id", async (req: Request, res: Response) => {
  //   console.log(req);
  try {
    const { id } = req.params;
    const result = await pool.query(
      `
        DELETE FROM users WHERE id=$1 
    `,
      [id],
    );
    if (result.rowCount === 0) {
      res.status(404).json({
        success: false,
        message: "User Not Found",
      });
    }
    res.status(200).json({
      success: true,
      message: "User Deleted Successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error?.message,
      error: error,
    });
  }
});

app.listen(config.port, () => {
  console.log(`Express is running in port ${config.port}`);
});
