import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';
import { registerSchema, loginSchema } from '../validations/auth.validation.js';

export const register = async (req: Request, res: Response) => {
    try {
        const validatedData = registerSchema.parse(req.body);

        // 1. Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: validatedData.email },
        });

        if (existingUser) {
            return res.status(409).json({ message: 'User with this email already exists' });
        }

        // 2. Hash password
        const hashedPassword = await bcrypt.hash(validatedData.password, 10);

        // 3. Create user in PostgreSQL
        const user = await prisma.user.create({
            data: {
                email: validatedData.email,
                password: hashedPassword,
                name: validatedData.name,
            },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
            },
        });

        // 4. Generate JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET || 'secret-fallback',
            { expiresIn: '7d' }
        );

        return res.status(201).json({
            message: 'User registered successfully',
            user,
            token,
        });
    } catch (error: any) {
        if (error.errors) {
            return res.status(400).json({ errors: error.errors });
        }
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const validatedData = loginSchema.parse(req.body);

        // 1. Find user by email
        const user = await prisma.user.findUnique({
            where: { email: validatedData.email },
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // 2. Compare password
        const isPasswordValid = await bcrypt.compare(validatedData.password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // 3. Generate JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET || 'secret-fallback',
            { expiresIn: '7d' }
        );

        return res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
            token,
        });
    } catch (error: any) {
        if (error.errors) {
            return res.status(400).json({ errors: error.errors });
        }
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};
