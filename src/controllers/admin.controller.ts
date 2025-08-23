import { Request, Response } from "express";

export const getAdmin = (req: Request, res: Response) => {
  res.json({ message: "Admin fetched successfully 👑" });
};
