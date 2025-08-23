import { Request, Response } from "express";

export const getUser = (req: Request, res: Response) => {
  res.json({ message: "User fetched successfully 🚀" });
};

export const createUser = (req: Request, res: Response) => {
  res.json({ message: "User created successfully 🚀" });
};
