//Step 1 - Task 1: Create authRoutes.js file -- OK
//Step 1 - Task 2: Import necessary packages -- OK
const express = require('express');
const app = express();
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const connectToDatabase = require('../models/db');
const router = express.Router();
const dotenv = require('dotenv');
const pino = require('pino');  // Import Pino logger
//Step 1 - Task 3: Create a Pino logger instance
const logger = pino();  // Create a Pino logger instance

dotenv.config();
//Step 1 - Task 4: Create JWT secret
const JWT_SECRET = process.env.JWT_SECRET;

router.post('/register', async (req, res) => {
    try {
        const { email, firstName, lastName, password } = req.body; // Extraemos los datos del body

        // Task 1: Connect to `giftsdb`
        const db = await connectToDatabase();

        // Task 2: Access MongoDB collection
        const collection = db.collection("users");

        // Task 3: Check for existing email
        const existingUser = await collection.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
        }
        
        // --- CORRECCIÓN AQUÍ ---
        // Generamos el hash real de la contraseña que viene en el request
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(password, salt);

        // Task 4: Save user details in database
        const newUser = await collection.insertOne({
            email,
            firstName,
            lastName,
            password: hashedPassword, // Guardamos la contraseña cifrada
            createdAt: new Date(),
        });

        // Task 5: Create JWT authentication
        const payload = {
            user: {
                id: newUser.insertedId,
            },
        };
        const authtoken = jwt.sign(payload, JWT_SECRET);

        logger.info('User registered successfully');
        
        // Enviamos el token y el email (ahora email está definido gracias a la desestructuración arriba)
        res.json({ authtoken, email });

    } catch (e) {
         logger.error(e); // Es mejor usar el logger para el error
         return res.status(500).send('Internal server error: ' + e.message);
    }
});

module.exports = router;
