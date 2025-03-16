"use server";

import { MongoClient, ServerApiVersion } from 'mongodb';

const { DB_URI } = process.env;

if (!DB_URI) {
  throw new Error(
    "Please define the DB_URI environment variable inside .env.local",
  );
}

const client = new MongoClient(DB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

export const checkMongoDB = async (): Promise<boolean> => {
  return new Promise(async (resolve, reject) => {
    try {
      await client.connect();
      await client.db("admin").command({ ping: 1 });
      resolve(true);
    } catch (error) {
      reject(error);
    } finally {
      await client.close();
    }
  });
};

// run().catch(console.dir);
