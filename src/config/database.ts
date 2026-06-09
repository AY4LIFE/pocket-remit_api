import { Pool } from "pg"
import { createClient } from "redis"
import "dotenv/config"

export const redisClient = createClient({
    socket: {
        host: "localhost",
        port: 6379
    },
})

redisClient.on("error", (err) => console.error(`Redis error: ${err}`))

export const connectRedis = async () => {
    await redisClient.connect()
    console.log("Redis connected")
}

export const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: 5432,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB
})

export const query = async (text: string, params?: any[]) => {
    const result = await pool.query(text, params)
    return result.rows
}
