import { MongoClient, type Db } from "mongodb"

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your MongoDB URI to .env")
}

if (!process.env.MONGODB_DB_NAME) {
  throw new Error("Please add your MongoDB database name to .env")
}

const uri = process.env.MONGODB_URI
const dbName = process.env.MONGODB_DB_NAME

let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb }
  }

  const client = await MongoClient.connect(uri)
  const db = client.db(dbName)

  cachedClient = client
  cachedDb = db

  return { client, db }
}

export async function getCollection(collectionName: string) {
  const { db } = await connectToDatabase()
  return db.collection(collectionName)
}

export async function connectToCrawlerDatabase() {
  if (!process.env.MONGODB_URI) {
    throw new Error("Please add your MongoDB URI to .env")
  }

  const client = await MongoClient.connect(process.env.MONGODB_URI)
  const db = client.db("crawler")

  return { client, db }
}

export async function getCrawlerCollection(collectionName: string) {
  const { db } = await connectToCrawlerDatabase()
  return db.collection(collectionName)
}
