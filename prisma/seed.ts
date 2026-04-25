import { PrismaClient } from "@prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"

const dbUrl = process.env.DATABASE_URL ?? "file:./dev.db"
const adapter = new PrismaBetterSqlite3({ url: dbUrl })
const prisma = new PrismaClient({ adapter } as any)

const COLLECTIONS = [
  { name: "Video Games", slug: "video-games", icon: "🎮", description: "Video game cartridges, discs, and digital titles" },
  { name: "Consoles", slug: "consoles", icon: "🕹️", description: "Gaming consoles and accessories" },
  { name: "Books", slug: "books", icon: "📚", description: "Novels, non-fiction, and reference books" },
  { name: "Comics", slug: "comics", icon: "💬", description: "Comic books, graphic novels, and manga" },
  { name: "Board Games", slug: "board-games", icon: "♟️", description: "Board games, card games, and tabletop RPGs" },
  { name: "Trading Cards", slug: "trading-cards", icon: "🃏", description: "Trading card games and collectible cards" },
  { name: "Movies", slug: "movies", icon: "🎬", description: "DVDs, Blu-rays, and movie memorabilia" },
  { name: "Memorabilia", slug: "memorabilia", icon: "🏆", description: "Collectible memorabilia and signed items" },
  { name: "Vinyl Records", slug: "vinyl-records", icon: "💿", description: "Vinyl records and music collectibles" },
]

async function main() {
  console.log("Seeding collections...")
  for (const col of COLLECTIONS) {
    await prisma.collection.upsert({
      where: { slug: col.slug },
      update: {},
      create: col,
    })
  }
  console.log("Done.")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
