import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { notFound } from 'next/navigation'
import { db } from '@/src/db'
import { formatPrice } from '@/src/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import StatusDropdown from './StatusDropdown'

export default async function Page() {
  //1 Get user logged in user
  const { getUser } = getKindeServerSession()
  const user = await getUser()
  const { ADMIN_EMAIL } = process.env
  const WEEKLY_GOAL = 500
  const MONTHLY_GOAL = 2500

  //2 Check if valid user or user is admin
  if (!user || user.email !== ADMIN_EMAIL) return notFound()

  // 3 Get orders from db
  const orders = await db.order.findMany({
    where: {
      isPaid: true,
      // orders created a week ago and older
      createdAt: {
        gte: new Date(new Date().setDate(new Date().getDate() - 7)),
      },
    },
    orderBy: { createdAt: 'desc' },
    include: { user: true, shippingAddress: true },
  })

  // 4 Calculate total sales
  const lastWeekSum = await db.order.aggregate({
    where: {
      isPaid: true,
      // orders created a week ago and older
      createdAt: {
        gte: new Date(new Date().setDate(new Date().getDate() - 7)),
      },
    },
    _sum: { amount: true },
  })

  const lastMonthSum = await db.order.aggregate({
    where: {
      isPaid: true,
      // orders created a week ago and older
      createdAt: {
        gte: new Date(new Date().setDate(new Date().getDate() - 30)),
      },
    },
    _sum: { amount: true },
  })

  return (
    <div className='flex min-h-screen w-full bg-muted/40'>
      <div className='max-w-7xl w-full mx-auto flex flex-col sm:gap-4 sm:py-4'>
        <div className='flex flex-col gap-16'>
          <div className='grid gap-4 sm:grid-cols-2'>
            <Card>
              <CardHeader className='pb-2'>
                <CardDescription>Last Week</CardDescription>
                <CardTitle>
                  {formatPrice(lastWeekSum._sum.amount ?? 0)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-sm text-muted-foreground'>
                  of {formatPrice(WEEKLY_GOAL)} goal{' '}
                </div>
              </CardContent>
              <CardFooter>
                <Progress
                  value={((lastWeekSum._sum.amount ?? 0) * 100) / WEEKLY_GOAL}
                />
              </CardFooter>
            </Card>
            <Card>
              <CardHeader className='pb-2'>
                <CardDescription>Last Month</CardDescription>
                <CardTitle>
                  {formatPrice(lastMonthSum._sum.amount ?? 0)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-sm text-muted-foreground'>
                  of {formatPrice(MONTHLY_GOAL)} goal{' '}
                </div>
              </CardContent>
              <CardFooter>
                <Progress
                  value={((lastMonthSum._sum.amount ?? 0) * 100) / MONTHLY_GOAL}
                />
              </CardFooter>
            </Card>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead className='hidden sm:table-cell'>Status</TableHead>
                <TableHead className='hidden sm:table-cell'>
                  Purchase Date
                </TableHead>
                <TableHead className='text-right'>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} className='bg-accent'>
                  <TableCell>
                    <div className='font-medium'>
                      {order.shippingAddress?.name}
                    </div>
                    <div className='hidden text-sm text-muted-foreground md:inline'>
                      {order.user.email}
                    </div>
                  </TableCell>
                  <TableCell className='hidden sm:table-cell'>
                    <StatusDropdown id={order.id} orderStatus={order.status} />
                  </TableCell>
                  <TableCell className='hidden md:table-cell'>
                    {order.createdAt.toLocaleDateString()}
                  </TableCell>
                  <TableCell className='text-right'>
                    {formatPrice(order.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
