import { type NextRequest, NextResponse } from "next/server"
import { getCrawlerCollection, getCollection } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sortBy = searchParams.get("sortBy") || "starttime"
    const mine = searchParams.get("mine") === "1"
    const userUid = searchParams.get("userUid") || ""
    const searchQuery = searchParams.get("search") || ""
    const limit = searchParams.get("limit") ? Number.parseInt(searchParams.get("limit")!) : undefined

    // Get user info
    const usersCollection = await getCollection("users")
    const user = await usersCollection.findOne({ uid: userUid })
    const username = user?.name || "Unknown"

    // Fetch all crawler documents
    const crawlerCollection = await getCrawlerCollection("db-list")
    const cursor = crawlerCollection.find()
    const crawlDbList = await cursor.toArray()

    let fullStorage = 0
    let activeCrawl = 0
    const filteredList = []


    const formatSize = (bytes_size: number): string => {
      if (bytes_size < 1024) return `${bytes_size} B`
      const kb = bytes_size / 1024
      if (kb < 1024) return `${Math.round(kb)} KB`
      const mb = kb / 1024
      if (mb < 1024) return `${Math.round(mb)} MB`
      const gb = mb / 1024
      return `${gb.toFixed(1)} GB`
    }

    // Process each document
    for (const crawlDb of crawlDbList) {
      const name = crawlDb.name || ""
      const parts = name.split("_")
      const typ = parts[0] || ""

      // Determine crawl type
      let crawlType = typ
      switch (typ) {
        case "navernews":
          crawlType = "Naver News"
          break
        case "naverblog":
          crawlType = "Naver Blog"
          break
        case "navercafe":
          crawlType = "Naver Cafe"
          break
        case "youtube":
          crawlType = "YouTube"
          break
      }
      const processedDoc = {
        _id: crawlDb._id.toString(),
        uid: crawlDb.uid || "",
        name: name,
        crawlType: crawlType,
        startDate: parts[2] || "",
        endDate: parts[3] || "",
        crawlOption: String(crawlDb.crawlOption || ""),
        crawlSpeed: String(crawlDb.crawlSpeed || ""),
        requester: crawlDb.requester || "",
        keyword: crawlDb.keyword || "",
        crawlCom: crawlDb.crawlCom || "",
        startTime: crawlDb.startTime || "",
        endTime: crawlDb.endTime || "",
        dbSize: crawlDb.dbSize || 0,
        datainfo: crawlDb.datainfo || {},
        status: "Done",
        formattedSize: "",
      }

      // Filter by "mine" option
      if (mine && processedDoc.requester !== username) {
        continue
      }

      // Determine status
      const endt = crawlDb.endTime
      if (endt.includes("%")) {
        processedDoc.endTime = endt
        processedDoc.status = "Working"
        activeCrawl++
      } else if (endt === "X") {
        processedDoc.endTime = "오류 중단"
        processedDoc.status = "Error"
      }

      // Format dbSize
      const size = Number(crawlDb.dbSize) || 0
      if (size === 0) {
        processedDoc.formattedSize = "0 B"
      } else {
        fullStorage += size
        processedDoc.formattedSize = formatSize(size)
      }

      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase()
        const matchesSearch =
          processedDoc.keyword.toLowerCase().includes(searchLower) ||
          processedDoc.name.toLowerCase().includes(searchLower) ||
          processedDoc.requester.toLowerCase().includes(searchLower)

        if (!matchesSearch) {
          continue
        }
      }
      
      filteredList.push(processedDoc)
    }

    // Sort
    if (sortBy === "keyword") {
      filteredList.sort((a, b) => {
        const keyA = a.keyword.replace(/"/g, "")
        const keyB = b.keyword.replace(/"/g, "")
        return keyA.localeCompare(keyB)
      })
    } else if (sortBy === "starttime") {
      filteredList.sort((a, b) => {
        const parseDate = (dateStr: string) => {
          if (!dateStr) return new Date(0)
          try {
            return new Date(dateStr)
          } catch {
            return new Date(0)
          }
        }
        return parseDate(b.startTime).getTime() - parseDate(a.startTime).getTime()
      })
    }

    const limitedList = limit ? filteredList.slice(0, limit) : filteredList

    const formattedStorage = formatSize(fullStorage);

    return NextResponse.json({
      crawls: limitedList,
      totalCrawls: filteredList.length,
      activeCrawls: activeCrawl,
      totalStorage: formattedStorage,
      // Keep legacy format for backward compatibility
      success: true,
      data: limitedList,
      fullStorage: Math.round(fullStorage * 10) / 10,
      activeCrawl,
    })
  } catch (error) {
    console.error("[v0] Crawler API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch crawler data",
        crawls: [],
        totalCrawls: 0,
        activeCrawls: 0,
        totalStorage: "0 GB",
      },
      { status: 500 },
    )
  }
}
