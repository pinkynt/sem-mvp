"use client";

/* eslint-disable react-hooks/incompatible-library -- TanStack Table is explicitly required for dashboard table state. */

import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState, type VisibilityState } from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export function DataTable<TData>({ columns, data, searchPlaceholder = "Filtrar", globalFilterValue, onGlobalFilterValueChange }: { columns: ColumnDef<TData>[]; data: TData[]; searchPlaceholder?: string; globalFilterValue?: string; onGlobalFilterValueChange?: (value: string) => void }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState(globalFilterValue ?? "");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  useEffect(() => { if (globalFilterValue !== undefined) setGlobalFilter(globalFilterValue); }, [globalFilterValue]);
  function handleGlobalFilterChange(value: string) { setGlobalFilter(value); onGlobalFilterValueChange?.(value); }
  const table = useReactTable({ data, columns, state: { sorting, globalFilter, columnVisibility }, onSortingChange: setSorting, onGlobalFilterChange: setGlobalFilter, onColumnVisibilityChange: setColumnVisibility, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel(), getPaginationRowModel: getPaginationRowModel() });

  return (
    <section className="rounded-card border border-border bg-surface p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input value={globalFilter} onChange={(event) => handleGlobalFilterChange(event.target.value)} placeholder={searchPlaceholder} className="min-h-11 rounded-input border border-border bg-surface px-4 text-sm outline-none focus-visible:ring-4 focus-visible:ring-brand/20" />
        <div className="flex flex-wrap items-center gap-2">
          <details className="relative">
            <summary className="cursor-pointer rounded-pill border border-border px-4 py-2 text-sm font-bold text-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20">Columnas</summary>
            <div className="absolute right-0 z-10 mt-2 w-56 space-y-2 rounded-card border border-border bg-surface p-3 shadow-lg">
              {table.getAllLeafColumns().filter((column) => column.getCanHide()).map((column) => (
                <label key={column.id} className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <input type="checkbox" checked={column.getIsVisible()} onChange={column.getToggleVisibilityHandler()} className="size-4 accent-brand" />
                  {typeof column.columnDef.header === "string" ? column.columnDef.header : column.id}
                </label>
              ))}
            </div>
          </details>
          <p className="text-sm font-semibold text-ink-soft">{table.getFilteredRowModel().rows.length} registros</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="text-left text-xs uppercase tracking-wide text-ink-soft">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="border-b border-border px-3 py-3 font-bold">
                    {header.isPlaceholder ? null : <button className={cn("text-left", header.column.getCanSort() && "hover:text-brand")} onClick={header.column.getToggleSortingHandler()}>{flexRender(header.column.columnDef.header, header.getContext())}</button>}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="align-top hover:bg-brand-tint/45">
                {row.getVisibleCells().map((cell) => <td key={cell.id} className="border-b border-border px-3 py-4">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <button className="rounded-pill border border-border px-4 py-2 text-sm font-bold text-brand disabled:opacity-40" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Anterior</button>
        <span className="text-sm text-ink-soft">Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount() || 1}</span>
        <button className="rounded-pill border border-border px-4 py-2 text-sm font-bold text-brand disabled:opacity-40" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Siguiente</button>
      </div>
    </section>
  );
}
