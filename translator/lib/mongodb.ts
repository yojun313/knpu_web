import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/paper-translator"

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable")
}

let cached = (global as any).mongoose

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null }
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log("✅ MongoDB 연결 성공!")
      console.log(`📊 데이터베이스: ${mongoose.connection.db.databaseName}`)
      console.log(`🔗 호스트: ${mongoose.connection.host}:${mongoose.connection.port}`)
      return mongoose
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    console.error("❌ MongoDB 연결 실패:", e)
    throw e
  }

  return cached.conn
}

// 컬렉션 정보 출력 함수
export async function getCollectionInfo() {
  const connection = await connectDB()
  const collections = await connection.connection.db.listCollections().toArray()

  console.log("📋 사용 중인 컬렉션들:")
  collections.forEach((collection) => {
    console.log(`  - ${collection.name}`)
  })

  return collections
}
