import {createClient} from 'redis'
import 'dotenv/config'

// ------------------------------------
// REDIS CLIENT
// Using the 'redis' package (v6) which is already
// installed in your project.
// createClient() sets up the connection config.
// We then call .connect() to actually connect.
// ------------------------------------

const redis = createClient({
    socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379
    }
})

// ------------------------------------
// CONNECTION EVENTS
// Same idea as before — listen for connect and error events
// ------------------------------------
redis.on('connect', () => {
    console.log('Redis connected')
})

redis.on('error', (error) => {
    console.error('Redis connection error:', error)
})

export const connectRedis = async () => {
    await redis.connect()
}

export default redis
