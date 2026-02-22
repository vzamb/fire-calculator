import { useState } from 'react';
import { useFireStore } from '@/store/fireStore';
import { useUIStore } from '@/store/uiStore';
import { formatCurrency } from '@/lib/formatters';
import { useT } from '@/lib/i18n';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ROWS_PER_PAGE = 20;

export function YearlyProjectionsTable() {
  const { result, inputs } = useFireStore();
  const { showRealValues } = useUIStore();
  const t = useT();
  const [page, setPage] = useState(0);

  const inflation = inputs.expenses.annualInflationRate / 100;

  const deflate = (value: number, yearIdx: number) =>
    showRealValues ? value / Math.pow(1 + inflation, yearIdx) : value;

  const totalPages = Math.ceil(result.yearlyProjections.length / ROWS_PER_PAGE);
  const currentData = result.yearlyProjections.slice(
    page * ROWS_PER_PAGE,
    (page + 1) * ROWS_PER_PAGE
  );

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">{t.age}</TableHead>
              <TableHead>{t.year}</TableHead>
              <TableHead className="text-right">{t.portfolio}</TableHead>
              <TableHead className="text-right">{t.contributions}</TableHead>
              <TableHead className="text-right">{t.growth}</TableHead>
              <TableHead className="text-right">{t.expenses}</TableHead>
              <TableHead className="text-right">{t.income}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.map((p, idx) => {
              const yearIdx = page * ROWS_PER_PAGE + idx;
              return (
                <TableRow key={p.year} className={p.isRetired ? 'bg-primary/5' : ''}>
                  <TableCell className="font-medium">{p.age}</TableCell>
                  <TableCell>{p.year}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(deflate(p.portfolioValue, yearIdx))}
                  </TableCell>
                  <TableCell className="text-right font-mono text-emerald-500">
                    {p.annualContributions > 0 ? `+${formatCurrency(deflate(p.annualContributions, yearIdx))}` : '-'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-emerald-500">
                    {p.annualInvestmentGrowth > 0 ? `+${formatCurrency(deflate(p.annualInvestmentGrowth, yearIdx))}` : '-'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-red-400">
                    {formatCurrency(deflate(p.annualExpenses, yearIdx))}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(deflate(p.totalIncome, yearIdx))}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t.page} {page + 1} {t.of} {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
