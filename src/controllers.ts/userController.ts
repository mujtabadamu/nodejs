// standardized response structure 

import { Response } from 'express';
import { createUserService, deleteUserService, getAllUserService, getUserByIdService, updateUserService } from '../models/userModel';

const handleResponse = (res: Response, status:number, message: string, data: any) => {
  res.status(status).json({
    status,
    message,
    data,
  });
};

export const createUser = async (req: any, res: Response, next: Function) => {
  try {
    const { name, email } = req.body;
    const newUser = await createUserService(name, email);
    handleResponse(res, 201, "User created successfully", newUser);
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req: any, res: Response, next: Function) => {
  try {
    const users = await getAllUserService();
    handleResponse(res, 200, "Users retrieved successfully", users);
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req: any, res: Response, next: Function) => {
  try {
    const user = await getUserByIdService(req.params.id);
    if(!user) {
      return handleResponse(res, 404, "User not found", null);
    }
    handleResponse(res, 200, "User retrieved successfully", user);
  } catch (error) {
    next(error);
  }
};
export const updateUser = async (req: any, res: Response, next: Function) => {
    const { name, email } = req.body;
    try {
    const user = await updateUserService(req.params.id, name, email);
    if(!user) {
      return handleResponse(res, 404, "User not found", null);
    }
    handleResponse(res, 200, "User updated successfully", user);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: any, res: Response, next: Function) => {
    try {
    const user = await deleteUserService(req.params.id);
    if(!user) {
      return handleResponse(res, 404, "User not found", null);
    }
    handleResponse(res, 200, "User deleted successfully", user);
  } catch (error) {
    next(error);
  }
};
