"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RevenuePointDto } from "@/contracts/dashboard";
import { formatCurrency } from "@/components/dashboard/format";

export function RevenueChart({ data }: { data: RevenuePointDto[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ left: 0, right: 16, top: 16, bottom: 0 }}>
        <CartesianGrid stroke="oklch(0.90 0.012 245)" vertical={false} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(value) => `$${Number(value) / 100}`} />
        <Tooltip formatter={(value) => formatCurrency(Number(value))} labelFormatter={(label) => `Día ${label}`} />
        <Bar dataKey="cashCents" name="Efectivo" stackId="revenue" fill="oklch(0.34 0.10 252)" radius={[8, 8, 0, 0]} />
        <Bar dataKey="digitalCents" name="Mercado Pago" stackId="revenue" fill="oklch(0.70 0.12 230)" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
