"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

// Mock data for futures contracts
const MOCK_CONTRACTS = [
  {
    ticker: "ESZ5",
    name: "S&P 500",
    trend: "BULLISH",
    rsi: 65,
    macd: 2.1,
    vwap: "Above",
    oi: "+3.6k",
    mtf: 8.5,
  },
  {
    ticker: "NQZ5",
    name: "Nasdaq",
    trend: "BULLISH",
    rsi: 71,
    macd: 3.2,
    vwap: "Above",
    oi: "+2.1k",
    mtf: 7.8,
  },
  {
    ticker: "YMZ5",
    name: "Dow Jones",
    trend: "BULLISH",
    rsi: 58,
    macd: 1.4,
    vwap: "At",
    oi: "+1.2k",
    mtf: 6.5,
  },
  {
    ticker: "GCZ5",
    name: "Gold",
    trend: "BEARISH",
    rsi: 42,
    macd: -1.4,
    vwap: "Below",
    oi: "-0.8k",
    mtf: 4.2,
  },
  {
    ticker: "SIZ5",
    name: "Silver",
    trend: "BEARISH",
    rsi: 38,
    macd: -2.1,
    vwap: "Below",
    oi: "-1.1k",
    mtf: 3.8,
  },
  {
    ticker: "CLZ5",
    name: "Crude Oil",
    trend: "NEUTRAL",
    rsi: 52,
    macd: 0.3,
    vwap: "At",
    oi: "+0.4k",
    mtf: 5.2,
  },
  {
    ticker: "NGZ5",
    name: "Nat Gas",
    trend: "BULLISH",
    rsi: 68,
    macd: 1.8,
    vwap: "Above",
    oi: "+2.4k",
    mtf: 7.1,
  },
  {
    ticker: "ZCZ5",
    name: "Corn",
    trend: "NEUTRAL",
    rsi: 48,
    macd: -0.2,
    vwap: "Below",
    oi: "-0.3k",
    mtf: 4.8,
  },
  {
    ticker: "ZSZ5",
    name: "Soybeans",
    trend: "BEARISH",
    rsi: 35,
    macd: -1.9,
    vwap: "Below",
    oi: "-1.5k",
    mtf: 3.5,
  },
  {
    ticker: "ZWZ5",
    name: "Wheat",
    trend: "NEUTRAL",
    rsi: 51,
    macd: 0.1,
    vwap: "At",
    oi: "+0.2k",
    mtf: 5.0,
  },
];

interface IndicatorTableProps {
  asset: string;
  timeframe: string;
  selectedContract: string | null;
  onSelectContract: (ticker: string) => void;
}

export function IndicatorTable({
  asset,
  timeframe,
  selectedContract,
  onSelectContract,
}: IndicatorTableProps) {
  // Filter by asset if not "ALL"
  const contracts =
    asset === "ALL" ? MOCK_CONTRACTS : MOCK_CONTRACTS.filter((c) => c.ticker.startsWith(asset));

  return (
    <Card className="h-full flex flex-col border-white/10 bg-card/50">
      <CardHeader className="py-3 px-4 border-b border-white/10">
        <CardTitle className="text-sm font-medium">Indicator Signals · {timeframe}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-0">
        <Table>
          <TableHeader className="sticky top-0 bg-card z-10">
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-xs w-[100px]">Contract</TableHead>
              <TableHead className="text-xs w-[80px]">Trend</TableHead>
              <TableHead className="text-xs w-[60px] text-right">RSI</TableHead>
              <TableHead className="text-xs w-[80px] text-right">MACD</TableHead>
              <TableHead className="text-xs w-[70px]">VWAP</TableHead>
              <TableHead className="text-xs w-[70px] text-right">OI Δ</TableHead>
              <TableHead className="text-xs w-[70px] text-right">Multi-TF</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.map((contract) => (
              <TableRow
                key={contract.ticker}
                className={cn(
                  "cursor-pointer border-white/5 transition-colors",
                  selectedContract === contract.ticker ? "bg-primary/10" : "hover:bg-muted/30"
                )}
                onClick={() => onSelectContract(contract.ticker)}
              >
                <TableCell className="font-medium">
                  <div>
                    <span className="text-sm">{contract.ticker}</span>
                    <span className="text-xs text-muted-foreground ml-2">{contract.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] font-medium",
                      contract.trend === "BULLISH" && "border-emerald-500/50 text-emerald-500",
                      contract.trend === "BEARISH" && "border-rose-500/50 text-rose-500",
                      contract.trend === "NEUTRAL" && "border-gray-500/50 text-gray-400"
                    )}
                  >
                    {contract.trend}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={cn(
                      "font-mono text-sm",
                      contract.rsi > 70 && "text-rose-500",
                      contract.rsi < 30 && "text-emerald-500",
                      contract.rsi >= 30 && contract.rsi <= 70 && "text-foreground"
                    )}
                  >
                    {contract.rsi}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="flex items-center justify-end gap-1 font-mono text-sm">
                    {contract.macd > 0 ? (
                      <ArrowUp className="w-3 h-3 text-emerald-500" />
                    ) : contract.macd < 0 ? (
                      <ArrowDown className="w-3 h-3 text-rose-500" />
                    ) : (
                      <Minus className="w-3 h-3 text-gray-500" />
                    )}
                    <span
                      className={cn(
                        contract.macd > 0 && "text-emerald-500",
                        contract.macd < 0 && "text-rose-500"
                      )}
                    >
                      {contract.macd > 0 ? "+" : ""}
                      {contract.macd.toFixed(1)}
                    </span>
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px]",
                      contract.vwap === "Above" && "bg-emerald-500/20 text-emerald-400",
                      contract.vwap === "Below" && "bg-rose-500/20 text-rose-400",
                      contract.vwap === "At" && "bg-gray-500/20 text-gray-400"
                    )}
                  >
                    {contract.vwap}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={cn(
                      "font-mono text-sm",
                      contract.oi.startsWith("+") && "text-emerald-500",
                      contract.oi.startsWith("-") && "text-rose-500"
                    )}
                  >
                    {contract.oi}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          contract.mtf >= 7 && "bg-emerald-500",
                          contract.mtf >= 4 && contract.mtf < 7 && "bg-yellow-500",
                          contract.mtf < 4 && "bg-rose-500"
                        )}
                        style={{ width: `${contract.mtf * 10}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs">{contract.mtf}</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
