
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from 'express';

type TokenPayload = {
  userId: string;
  userName: string;
  userLevel: number;
}

export function verificaToken(req: Request, res: Response, next: NextFunction) {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ error: "Token não informado" });
  }

  const token = authorization.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_KEY as string);
    
    const { userId, userName, userLevel } = decoded as TokenPayload;

    req.userLogadoId    = userId;
    req.userLogadoNome  = userName;
    req.userLogadoNivel = userLevel;

    next();
  } catch (error) {
    res.status(401).json({ error: "Token inválido" });
  }
}