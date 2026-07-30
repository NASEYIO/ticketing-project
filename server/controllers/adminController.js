// src/controllers/admin.controller.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getAdminAnalytics = async (req, res) => {
  try {
    // 1. Total Gross Revenue & Payment Health
    const revenueData = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { status: 'SUCCESSFUL' }
    });

    const successfulPayments = await prisma.order.count({ where: { status: 'SUCCESSFUL' } });
    const pendingPayments = await prisma.order.count({ where: { status: 'PENDING' } });
    const failedPayments = await prisma.order.count({ where: { status: 'FAILED' } });

    // 2. Ticket Counts
    const totalTicketsSold = await prisma.ticket.count();
    const scannedTickets = await prisma.ticket.count({
      where: { isUsed: true } // or status: 'USED' depending on your schema
    });

    // 3. Event Counts
    const totalEvents = await prisma.event.count({ where: { isApproved: true } });
    const pendingEvents = await prisma.event.count({ where: { isApproved: false } });

    // 4. User Counts
    const totalUsers = await prisma.user.count();
    const totalOrganizers = await prisma.user.count({ where: { role: 'ORGANIZER' } });

    // 5. Top Events by Ticket Count
    const topEventsQuery = await prisma.event.findMany({
      take: 5,
      select: {
        title: true,
        _count: { select: { tickets: true } }
      },
      orderBy: {
        tickets: { _count: 'desc' }
      }
    });

    const topEvents = topEventsQuery.map(ev => ({
      title: ev.title,
      ticketsSold: ev._count.tickets
    }));

    // Send the dynamic JSON response back to frontend
    res.json({
      totalRevenue: revenueData._sum.totalAmount || 0,
      totalTicketsSold,
      scannedTickets,
      totalEvents,
      pendingEvents,
      totalUsers,
      totalOrganizers,
      topEvents,
      payments: {
        successful: successfulPayments,
        pending: pendingPayments,
        failed: failedPayments
      }
    });
  } catch (error) {
    console.error("Analytics Error:", error);
    res.status(500).json({ message: "Failed to load admin analytics" });
  }
};