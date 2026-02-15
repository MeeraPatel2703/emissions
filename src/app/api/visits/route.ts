import { NextResponse } from 'next/server'
import { prisma } from '@/adapters/prisma/client'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const path = body.path ?? '/'

    await prisma.pageView.create({ data: { path } })

    const total = await prisma.pageView.count()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayCount = await prisma.pageView.count({
      where: { createdAt: { gte: today } },
    })

    return NextResponse.json({ total, today: todayCount })
  } catch {
    // DB not connected — return gracefully
    return NextResponse.json({ total: null, today: null })
  }
}

export async function GET() {
  try {
    const total = await prisma.pageView.count()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayCount = await prisma.pageView.count({
      where: { createdAt: { gte: today } },
    })
    const unique = await prisma.pageView.groupBy({
      by: ['path'],
      _count: true,
    })

    return NextResponse.json({
      total,
      today: todayCount,
      byPage: unique.map((u) => ({ path: u.path, views: u._count })),
    })
  } catch {
    return NextResponse.json({ total: null, today: null, byPage: [] })
  }
}
