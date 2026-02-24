import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Calculator,
  Receipt,
  ArrowRight,
  Percent,
  DollarSign,
  Briefcase,
  ShoppingBag,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Target
} from 'lucide-react';

export default function App() {
  const [rows, setRows] = useState([
    {
      id: Date.now(),
      base: 0,
      gainType: 'percent', // 'percent' or 'fixed'
      gainValue: 0,
      retentionType: 'venta' // 'venta' (2.5%) or 'servicio' (4%)
    }
  ]);

  const addRow = () => {
    setRows([...rows, {
      id: Date.now(),
      base: 0,
      gainType: 'percent',
      gainValue: 0,
      retentionType: 'venta'
    }]);
  };

  const removeRow = (id) => {
    if (rows.length > 1) {
      setRows(rows.filter(row => row.id !== id));
    }
  };

  const updateRow = (id, field, value) => {
    setRows(rows.map(row => {
      if (row.id === id) {
        return { ...row, [field]: value };
      }
      return row;
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPercent = (decimal) => {
    return `${(decimal * 100).toFixed(2)}%`;
  };

  const calculateRowData = (row) => {
    const baseVal = parseFloat(row.base) || 0;
    const ivaVal = baseVal * 0.19;
    const costoTotalCompra = baseVal + ivaVal;

    let gainAmount = 0;
    let gainPercentDisplay = 0;

    if (row.gainType === 'percent') {
      const gPer = parseFloat(row.gainValue) / 100 || 0;
      gainAmount = costoTotalCompra * gPer;
      gainPercentDisplay = gPer;
    } else {
      gainAmount = parseFloat(row.gainValue) || 0;
      gainPercentDisplay = costoTotalCompra > 0 ? gainAmount / costoTotalCompra : 0;
    }

    const valorVenta = costoTotalCompra + gainAmount;

    // CORRECCIÓN: Definir tasa de retención explícitamente
    const retRate = row.retentionType === 'servicio' ? 0.04 : 0.025;
    const retVal = valorVenta * retRate;
    const netoRecibir = valorVenta - retVal;

    return {
      baseVal,
      ivaVal,
      costoTotalCompra,
      gainAmount,
      gainPercentDisplay,
      valorVenta,
      retVal,
      retRate,
      netoRecibir
    };
  };

  const totals = rows.reduce((acc, row) => {
    const data = calculateRowData(row);
    return {
      base: acc.base + data.baseVal,
      iva: acc.iva + data.ivaVal,
      costoCompra: acc.costoCompra + data.costoTotalCompra,
      gain: acc.gain + data.gainAmount,
      venta: acc.venta + data.valorVenta,
      retention: acc.retention + data.retVal,
      total: acc.total + data.netoRecibir
    };
  }, { base: 0, iva: 0, costoCompra: 0, gain: 0, venta: 0, retention: 0, total: 0 });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 antialiased p-6 md:p-12">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 left-1/4 w-[50%] h-[50%] bg-indigo-50/40 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[50%] h-[50%] bg-blue-50/40 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-[1600px] mx-auto space-y-12">
        {/* Header - More Spacious */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 py-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-200">
                <Calculator className="text-white w-8 h-8" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
                Calculadora de <span className="text-indigo-600">Rentabilidad</span>
              </h1>
            </div>
            <p className="text-slate-500 font-medium text-xl max-w-2xl leading-relaxed">
              Analiza tus costos, proyecta ganancias y calcula retenciones sobre el valor final de venta.
            </p>
          </div>

          <button
            onClick={addRow}
            className="flex items-center justify-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-lg shadow-2xl shadow-slate-300 hover:bg-indigo-600 transition-all duration-300 active:scale-95 self-start lg:self-center"
          >
            <Plus size={24} />
            <span>Añadir Partida</span>
          </button>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          {/* List of Cards - Each one represents a "Partida" */}
          <div className="xl:col-span-8 space-y-8">
            {rows.map((row, index) => {
              const data = calculateRowData(row);
              return (
                <div
                  key={row.id}
                  className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-8 md:p-10 hover:border-indigo-100 transition-all duration-500 animate-in fade-in slide-in-from-bottom-8 relative overflow-hidden group"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/50 rounded-bl-[4rem] -z-0 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                  <div className="relative z-10 flex flex-col gap-10">
                    {/* Step 1: Purchase Cost */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
                      <div className="lg:col-span-5 space-y-4">
                        <div className="flex items-center gap-2 text-indigo-600">
                          <ShoppingBag size={18} className="font-bold" />
                          <h3 className="text-sm font-black uppercase tracking-[0.15em]">1. Costos de Compra</h3>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Valor Base (Neto)</label>
                          <div className="relative group/input">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-xl font-bold">$</span>
                            <input
                              type="number"
                              value={row.base || ''}
                              onChange={(e) => updateRow(row.id, 'base', e.target.value)}
                              className="w-full pl-10 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] focus:bg-white focus:border-indigo-500 transition-all font-black text-2xl"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="lg:col-span-2 text-center pb-5">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-400 font-bold">
                          +
                        </div>
                      </div>

                      <div className="lg:col-span-5 space-y-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Costo Total (Base + IVA 19%)</label>
                          <div className="w-full px-6 py-5 bg-indigo-50/50 border-2 border-indigo-100/50 rounded-[1.5rem] flex items-center justify-between">
                            <span className="text-indigo-400 font-bold">$</span>
                            <span className="text-2xl font-black text-indigo-700">{formatCurrency(data.costoTotalCompra)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-slate-100"></div>

                    {/* Step 2: Gain & Strategy */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                      <div className="lg:col-span-6 space-y-6">
                        <div className="flex items-center gap-2 text-emerald-600">
                          <TrendingUp size={18} />
                          <h3 className="text-sm font-black uppercase tracking-[0.15em]">2. Estrategia de Ganancia</h3>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => updateRow(row.id, 'gainType', 'percent')}
                              className={`flex-1 py-4 rounded-2xl font-bold border-2 transition-all flex items-center justify-center gap-2 ${row.gainType === 'percent' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-lg shadow-emerald-100' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'}`}
                            >
                              <Percent size={18} />
                              <span>Porcentaje</span>
                            </button>
                            <button
                              onClick={() => updateRow(row.id, 'gainType', 'fixed')}
                              className={`flex-1 py-4 rounded-2xl font-bold border-2 transition-all flex items-center justify-center gap-2 ${row.gainType === 'fixed' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-lg shadow-emerald-100' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'}`}
                            >
                              <DollarSign size={18} />
                              <span>Monto Fijo</span>
                            </button>
                          </div>

                          <div className="relative">
                            <input
                              type="number"
                              value={row.gainValue || ''}
                              onChange={(e) => updateRow(row.id, 'gainValue', e.target.value)}
                              className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] focus:bg-white focus:border-emerald-500 transition-all font-black text-2xl"
                              placeholder={row.gainType === 'percent' ? "Ej: 30%" : "Ej: 150000"}
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-xl text-sm font-black uppercase tracking-wider border border-emerald-200">
                              {row.gainType === 'percent' ? `+$ ${formatCurrency(data.gainAmount)}` : `+ ${formatPercent(data.gainPercentDisplay)}`}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="lg:col-span-6 space-y-6">
                        <div className="flex items-center gap-2 text-blue-600">
                          <Target size={18} />
                          <h3 className="text-sm font-black uppercase tracking-[0.15em]">3. Retención & Venta</h3>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
                            <button
                              onClick={() => updateRow(row.id, 'retentionType', 'venta')}
                              className={`flex-1 py-3 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 ${row.retentionType === 'venta' ? 'bg-white shadow-md text-blue-600 border border-blue-50' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                              Ventas (2.5%)
                            </button>
                            <button
                              onClick={() => updateRow(row.id, 'retentionType', 'servicio')}
                              className={`flex-1 py-3 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 ${row.retentionType === 'servicio' ? 'bg-white shadow-md text-blue-600 border border-blue-50' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                              Servicios (4%)
                            </button>
                          </div>

                          <div className="p-6 bg-slate-900 rounded-[1.5rem] text-white space-y-3 shadow-xl">
                            <div className="flex justify-between items-center opacity-60">
                              <span className="text-xs font-bold uppercase tracking-wider">Valor de Venta Neto</span>
                              <span className="font-bold">{formatCurrency(data.valorVenta)}</span>
                            </div>
                            <div className="flex justify-between items-center text-rose-400">
                              <span className="text-xs font-bold uppercase tracking-wider">Retención ({formatPercent(data.retRate)})</span>
                              <span className="font-black">-{formatCurrency(data.retVal)}</span>
                            </div>
                            <div className="h-px bg-white/10 my-2"></div>
                            <div className="flex justify-between items-baseline">
                              <span className="text-xs font-black uppercase tracking-widest text-indigo-400">NETO A RECIBIR</span>
                              <span className="text-3xl font-black text-white">{formatCurrency(data.netoRecibir)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => removeRow(row.id)}
                      className="absolute top-8 right-8 text-slate-200 hover:text-rose-500 transition-all p-3 rounded-2xl hover:bg-rose-50 group/del"
                      title="Eliminar esta partida"
                    >
                      <Trash2 size={24} className="group-hover/del:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sidebar Summary - Optimized for wide view */}
          <div className="xl:col-span-4">
            <div className="sticky top-12 space-y-8">
              <div className="bg-indigo-700 rounded-[3rem] p-10 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden backdrop-blur-xl">
                <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

                <h2 className="text-2xl font-black mb-10 flex items-center gap-4">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <Receipt size={24} />
                  </div>
                  Consolidado Total
                </h2>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-white/10 pb-4">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-indigo-200 uppercase tracking-[0.2em]">Suma Base</p>
                        <p className="text-2xl font-bold">{formatCurrency(totals.base)}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-end border-b border-white/10 pb-4">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-indigo-200 uppercase tracking-[0.2em]">Impuesto IVA (19%)</p>
                        <p className="text-2xl font-bold">{formatCurrency(totals.iva)}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center bg-indigo-800/50 p-6 rounded-3xl border border-white/5">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-indigo-300 uppercase tracking-[0.2em]">Costo Total Compra</p>
                        <p className="text-3xl font-black">{formatCurrency(totals.costoCompra)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 pt-4">
                    <div className="flex justify-between items-center text-emerald-300">
                      <span className="text-xs font-black uppercase tracking-widest">Utilidad Estimada</span>
                      <span className="text-xl font-black">+{formatCurrency(totals.gain)}</span>
                    </div>
                    <div className="flex justify-between items-center text-rose-300">
                      <span className="text-xs font-black uppercase tracking-widest">Total Retenciones</span>
                      <span className="text-xl font-black">-{formatCurrency(totals.retention)}</span>
                    </div>
                  </div>

                  <div className="pt-10 mt-6 border-t-2 border-dashed border-white/20">
                    <div className="flex flex-col gap-2">
                      <p className="text-xs font-black text-indigo-300 uppercase tracking-[0.3em]">RECIBIR NETO TOTAL</p>
                      <p className="text-6xl font-black tracking-tighter leading-none">{formatCurrency(totals.total)}</p>
                    </div>
                  </div>

                  <button className="w-full bg-slate-900 hover:bg-slate-800 text-white mt-12 py-6 rounded-3xl font-black text-lg transition-all flex items-center justify-center gap-4 group shadow-xl">
                    Descargar Resumen PDF
                    <ChevronRight size={24} className="group-hover:translate-x-2 transition-transform" />
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex items-start gap-4">
                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 shrink-0">
                  <CreditCard size={24} />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 uppercase tracking-wider text-sm mb-2">Información Fiscal</h4>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium">
                    Los cálculos de retención se aplican sobre el <strong>Valor de Venta (Costo + Ganancia)</strong>. Asegúrate de seleccionar el tipo de servicio correcto para cada partida.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
