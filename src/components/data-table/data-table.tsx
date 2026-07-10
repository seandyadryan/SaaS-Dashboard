import { useMemo, useState } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type DataTableProps<T> = {
  data: T[];
  columns: ColumnDef<T>[];
  searchPlaceholder?: string;
  filter?: React.ReactNode;
};

export function DataTable<T>({ data, columns, searchPlaceholder = "Search data...", filter }: DataTableProps<T>) {
  const [globalFilter, setGlobalFilter] = useState("");
  const table = useReactTable({
    data,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 5 } },
  });

  const pageSummary = useMemo(() => {
    const state = table.getState().pagination;
    return `${state.pageIndex + 1} / ${table.getPageCount() || 1}`;
  }, [table]);

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-700/70 p-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            className="pl-9"
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder={searchPlaceholder}
          />
        </div>
        {filter}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-950/30 text-xs uppercase tracking-[0.12em] text-slate-500">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 font-semibold">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="transition hover:bg-slate-800/40">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-4 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3 text-sm text-slate-400">
        <span>{table.getFilteredRowModel().rows.length} records</span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label="Previous page">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-12 text-center">{pageSummary}</span>
          <Button variant="ghost" size="icon" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label="Next page">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
