import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { LoadingSpinner } from '@/components';
import { useGetTopSearchesQuery } from '@/redux/services/analytics.api';
import { RootState } from '@/redux/store';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

type PeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all';

const AdminAnalytics = () => {
  const [period, setPeriod] = useState<PeriodType>('weekly');
  const [limit, setLimit] = useState(20);

  const { user, isLoggedIn } = useSelector(
    (state: RootState) => state.authSlice
  );
  const isAdmin = isLoggedIn && user.user.isAdmin;

  const { data, isLoading, isError, error } = useGetTopSearchesQuery({
    period,
    limit,
  });

  // Redirect non-admin users
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Search Analytics</h1>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Period:</label>
              <Select
                value={period}
                onValueChange={(value) => setPeriod(value as PeriodType)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Today</SelectItem>
                  <SelectItem value="weekly">This Week</SelectItem>
                  <SelectItem value="monthly">This Month</SelectItem>
                  <SelectItem value="yearly">This Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Limit:</label>
              <Select
                value={String(limit)}
                onValueChange={(value) => setLimit(Number(value))}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Limit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {data?.data.periodStart && data?.data.periodEnd && (
              <div className="text-sm text-muted-foreground ml-auto">
                {data.data.periodStart} - {data.data.periodEnd}
              </div>
            )}
          </div>
        </Card>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner />
          </div>
        ) : isError ? (
          <Card className="p-6">
            <p className="text-destructive">
              Error loading analytics:{' '}
              {(error as any)?.data?.error || 'Unknown error'}
            </p>
          </Card>
        ) : data?.data.results.length === 0 ? (
          <Card className="p-6">
            <p className="text-muted-foreground text-center">
              No search data available for this period.
            </p>
          </Card>
        ) : (
          <Card>
            <CardTitle className="p-4 border-b">
              Top {data?.data.results.length} Searches
            </CardTitle>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Rank</TableHead>
                  <TableHead>Search Term</TableHead>
                  <TableHead className="text-right w-[120px]">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.results.map((item, index) => (
                  <TableRow key={item.searchTerm}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{item.searchTerm}</TableCell>
                    <TableCell className="text-right font-mono">
                      {item.count.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default AdminAnalytics;
