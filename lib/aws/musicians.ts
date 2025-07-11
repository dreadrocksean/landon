import { ddb } from "./client";
import { PutCommand, GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { Musician } from "../schema";

const TableName = "Musicians";

export const createMusician = async (musician: Musician) => {
  await ddb.send(new PutCommand({ TableName, Item: musician }));
};

export const getMusician = async (id: string): Promise<Musician | null> => {
  const res = await ddb.send(new GetCommand({ TableName, Key: { id } }));
  return (res.Item as Musician) || null;
};

export const listMusicians = async (): Promise<Musician[]> => {
  const res = await ddb.send(new ScanCommand({ TableName }));
  return (res.Items || []) as Musician[];
};

export const updateMusician = async (musician: Musician) => {
  await ddb.send(new PutCommand({ TableName, Item: musician }));
};

export const deleteMusician = async (id: string) => {
  await ddb.send(new PutCommand({ TableName, Item: { id, isActive: false } }));
};
