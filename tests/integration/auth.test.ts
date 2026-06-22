import {describe, it, expect, beforeAll, afterAll, afterEach} from '@jest/globals'
import request from'supertest'
import app from '../../src/index.js'
import {AppDataSource} from '../../src/config/database.js'
import {User} from '../../src/models/User.js'



// ------------------------------------
// SETUP + TEARDOWN
// beforeAll → runs ONCE before all tests in this file
// afterAll  → runs ONCE after all tests in this file
// afterEach → runs after EVERY individual test
// ------------------------------------
beforeAll(async () => {
    // Initialize the database connection before tests run
    if (!AppDataSource.isInitialized){
        await AppDataSource.initialize()
    }
})

afterAll(async () => {
    // Close the DB connection cleanly after all tests finish
    // Without this, Jest hangs open waiting for the connection to close
    await AppDataSource.destroy()
    
})

afterEach(async () => {
    // ------------------------------------
    // CLEANUP
    // Delete any users created during tests so:
    //   1. Tests don't pollute your real database
    //   2. Tests don't affect each other (e.g. Test 2 depends
    //      on a user existing — that user shouldn't bleed into Test 3)
    // ------------------------------------
    await AppDataSource.getRepository(User).delete({
        email: 'testuser@gmail.com'
    })
})

// THE ACTUAL TESTS

describe('POST /auth/register', () => {
    // Test 1: Happy Path

    it ('creates a user and returns 201 when input is valid', async() => {
    
        // ARRANGE
        const newUser = {
            email: 'testuser@gmail.com',
            password: 'password123',
            full_name: 'Test User'
        }

        // ACT
        // supertest's request() takes your Express app directly -
        // no need to start a real server on a port
        const res = await request(app)
        .post('/auth/register')
        .send(newUser)

        // ASSERT
        expect(res.status).toBe(201)
        expect(res.body.message).toBe('Account created successfully')

        // Check the user object has the right fields
        expect(res.body.data.user).toHaveProperty('id')
        expect(res.body.data.user).toHaveProperty('email', 'testuser@gmail.com')
        expect(res.body.data.user).toHaveProperty('role', 'customer')

        // Token should be present
        expect(res.body.data).toHaveProperty('token')

        // Ensure the password hash is not present
        expect(res.body.data.user).not.toHaveProperty('password_hash')
    })

    // Test 2 - Duplicate Email
    it('returns 400 with an email that already exists', async () => {
        // ARRANGE
        await request(app)
        .post('/auth/register')
        .send({
            email: 'testuser@gmail.com',
            password: 'password123',
            full_name: 'Test User'
        });

        // ACT
        const res = await request(app)
        .post('/auth/register')
        .send({
            email: 'testuser@gmail.com',
            password: 'password123',
            full_name: 'Test User'
        })
        // ASSERT
        expect(res.status).toBe(409)
    })

    // Test 3 - Invalid Email Format
    it('returns 400 when email format is invalid', async() => {
        // ARRANGE
        const badEmail = {
            email: 'notanemail',
            password: 'password123',
            full_name: 'Test User'
        }

        // ACT
        const res = await request(app)
        .post('/auth/register')
        .send(badEmail)

        // ASSERT
        expect(res.status).toBe(400)
    })

    // Test 4 - Password Too Short
    it('returns 400 when password too short', async () => {
        // ARRANGE
        const shortPassword = {
            email: 'testuser@gmail.com',
            password: '1',
            full_name: "Test User"
        }

        // ACT
        const res = await request (app)
        .post('/auth/register')
        .send(shortPassword)

        // ASSERT
        expect(res.status).toBe(400)
    })

})