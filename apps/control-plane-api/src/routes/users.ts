import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient } from "../../node_modules/.prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Type definitions
interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
  role?: string;
}

interface UpdateUserRequest {
  email?: string;
  name?: string;
  password?: string;
  role?: string;
  isActive?: boolean;
}

export async function userRoutes(fastify: FastifyInstance) {
  // GET /api/users - Get all users
  fastify.get(
    "/api/users",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const users = await prisma.user.findMany({
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        return {
          success: true,
          data: users,
          count: users.length,
        };
      } catch (error) {
        fastify.log.error("Error fetching users:", error);
        reply.status(500);
        return {
          success: false,
          error: "Failed to fetch users",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }
  );

  // GET /api/users/:id - Get user by ID
  fastify.get(
    "/api/users/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;

        const user = await prisma.user.findUnique({
          where: { id },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        if (!user) {
          reply.status(404);
          return {
            success: false,
            error: "User not found",
          };
        }

        return {
          success: true,
          data: user,
        };
      } catch (error) {
        fastify.log.error("Error fetching user:", error);
        reply.status(500);
        return {
          success: false,
          error: "Failed to fetch user",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }
  );

  // POST /api/users - Create new user
  fastify.post(
    "/api/users",
    async (
      request: FastifyRequest<{ Body: CreateUserRequest }>,
      reply: FastifyReply
    ) => {
      try {
        const { email, name, password, role = "admin" } = request.body;

        // Validate required fields
        if (!email || !name || !password) {
          reply.status(400);
          return {
            success: false,
            error: "Missing required fields: email, name, password",
          };
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          reply.status(409);
          return {
            success: false,
            error: "User with this email already exists",
          };
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create user
        const user = await prisma.user.create({
          data: {
            email,
            name,
            password: hashedPassword,
            role,
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        reply.status(201);
        return {
          success: true,
          data: user,
          message: "User created successfully",
        };
      } catch (error) {
        fastify.log.error("Error creating user:", error);
        reply.status(500);
        return {
          success: false,
          error: "Failed to create user",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }
  );

  // PUT /api/users/:id - Update user
  fastify.put(
    "/api/users/:id",
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: UpdateUserRequest;
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const { email, name, password, role, isActive } = request.body;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { id },
        });

        if (!existingUser) {
          reply.status(404);
          return {
            success: false,
            error: "User not found",
          };
        }

        // Check if email is already taken by another user
        if (email && email !== existingUser.email) {
          const emailExists = await prisma.user.findUnique({
            where: { email },
          });

          if (emailExists) {
            reply.status(409);
            return {
              success: false,
              error: "Email is already taken by another user",
            };
          }
        }

        // Prepare update data
        const updateData: any = {};
        if (email) updateData.email = email;
        if (name) updateData.name = name;
        if (role) updateData.role = role;
        if (isActive !== undefined) updateData.isActive = isActive;

        // Hash password if provided
        if (password) {
          const saltRounds = 10;
          updateData.password = await bcrypt.hash(password, saltRounds);
        }

        // Update user
        const updatedUser = await prisma.user.update({
          where: { id },
          data: updateData,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        return {
          success: true,
          data: updatedUser,
          message: "User updated successfully",
        };
      } catch (error) {
        fastify.log.error("Error updating user:", error);
        reply.status(500);
        return {
          success: false,
          error: "Failed to update user",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }
  );

  // DELETE /api/users/:id - Delete user
  fastify.delete(
    "/api/users/:id",
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { id },
        });

        if (!existingUser) {
          reply.status(404);
          return {
            success: false,
            error: "User not found",
          };
        }

        // Delete user
        await prisma.user.delete({
          where: { id },
        });

        return {
          success: true,
          message: "User deleted successfully",
        };
      } catch (error) {
        fastify.log.error("Error deleting user:", error);
        reply.status(500);
        return {
          success: false,
          error: "Failed to delete user",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }
  );
}
