import { Request, Response } from 'express';
import { db } from '../db';

export const getDocuments = async (req: Request, res: Response) => {
  res.json([]);
};

export const getDocumentById = async (req: Request, res: Response) => {
  res.json({});
};

export const createDocument = async (req: Request, res: Response) => {
  res.status(201).json({ message: 'Created' });
};

export const updateDocument = async (req: Request, res: Response) => {
  res.json({ message: 'Updated' });
};

export const deleteDocument = async (req: Request, res: Response) => {
  res.json({ message: 'Deleted' });
};

export const getDocumentVersions = async (req: Request, res: Response) => {
  res.json([]);
};

export const restoreDocumentVersion = async (req: Request, res: Response) => {
  res.json({ message: 'Restored' });
};
