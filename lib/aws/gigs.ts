import { ddb } from "./client";
import { PutCommand, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { Gig } from "../schema";

const TableName = "Gigs";

export const createGig = async (gig: Gig) => {
  await ddb.send(new PutCommand({ TableName, Item: gig }));
};

export const getGig = async (id: string): Promise<Gig | null> => {
  const res = await ddb.send(new GetCommand({ TableName, Key: { id } }));
  return (res.Item as Gig) || null;
};

export const listGigsForMusician = async (
  musicianId: string
): Promise<Gig[]> => {
  const res = await ddb.send(
    new QueryCommand({
      TableName,
      IndexName: "MusicianIdIndex", // assumes you’ve created a GSI on musicianId
      KeyConditionExpression: "musicianId = :mid",
      ExpressionAttributeValues: {
        ":mid": musicianId,
      },
    })
  );
  return (res.Items || []) as Gig[];
};

export const updateGig = async (gig: Gig) => {
  await ddb.send(new PutCommand({ TableName, Item: gig }));
};

export const deleteGig = async (id: string) => {
  await ddb.send(new PutCommand({ TableName, Item: { id, status: "booked" } }));
};
