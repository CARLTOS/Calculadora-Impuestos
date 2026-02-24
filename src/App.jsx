import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calculator, Receipt, ArrowRight, Percent, DollarSign, Briefcase, ShoppingBag, Trash } from 'lucide-react';

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
    return `${(decimal * 100).toFixed(1)}%`;
  };

  // Totales generales para el resumen
  const calculateRowData = (row) => {
    const baseVal = parseFloat(row.base) || 0;
    const ivaVal = baseVal * 0.19;
    const baseMasIva = baseVal + ivaVal;

    let gainAmount = 0;
    let gainPercent = 0;

    if (row.gainType === 'percent') {
      gainPercent = parseFloat(row.gainValue) / 100 || 0;
      gainAmount = baseMasIva * gainPercent;
    } else {
      gainAmount = parseFloat(row.gainValue) || 0;
      gainPercent = baseMasIva > 0 ? gainAmount / baseMasIva : 0;
    }

    const valorVenta = baseMasIva + gainAmount;
    const retRate = row.retentionType === 'venta' ? 0.025 : 0.04;
    const retVal = valorVenta * retRate;
    const netoRecibir = valorVenta - retVal;

    return {
      baseVal,
      ivaVal,
      baseMasIva,
      gainAmount,
      gainPercent,
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
      gain: acc.gain + data.gainAmount,
      venta: acc.venta + data.valorVenta,
      retention: acc.retention + data.retVal,
      total: acc.total + data.netoRecibir
    };
  }, { base: 0, iva: 0, gain: 0, venta: 0, retention: 0, total: 0 });

  return (
    <div className="min-h-screen bg-[#fcfdfe] text-slate-900 font-sans selection:bg-indigo-100 antialiased p-4 md:p-10 overflow-x-hidden">
      {/* Abstract Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-50/50 rounded-full blur-[140px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-50/50 rounded-full blur-[140px]"></div>
      </div>

      <div className="max-w-7xl mx-auto space-y-10">
        {/* Modern Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold uppercase tracking-widest mb-1">
              <Calculator size={14} /> Facturación Inteligente
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-none">
              Calculadora Pro <span className="text-indigo-600">Impuestos</span>
            </h1>
            <p className="text-slate-500 font-medium text-lg">Calcula IVA, ganancias y retenciones en segundos.</p>
          </div>

          <button
            onClick={addRow}
            className="group flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold shadow-2xl shadow-slate-200 hover:bg-indigo-600 transition-all duration-300 active:scale-95"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            <span>Nueva Partida</span>
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Detailed Entries Section */}
          <div className="lg:col-span-12 xl:col-span-9 space-y-4">
            {rows.map((row, index) => {
              const data = calculateRowData(row);
              return (
                <div
                  key={row.id}
                  className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 md:p-8 hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">
                    {/* Input Group: Base & Gain */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full flex-grow">
                      {/* Base Cost */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Valor Base (Costo)</label>
                        <div className="relative group/input">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                          <input
                            type="number"
                            value={row.base || ''}
                            onChange={(e) => updateRow(row.id, 'base', e.target.value)}
                            className="w-full pl-8 pr-4 py-4 bg-slate-50/50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-lg"
                            placeholder="0"
                          />
                        </div>
                      </div>

                      {/* Gain Selector */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center ml-1">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Margen de Ganancia</label>
                          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                            <button
                              onClick={() => updateRow(row.id, 'gainType', 'percent')}
                              className={`p-1 px-2 rounded-md transition-all ${row.gainType === 'percent' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                              <Percent size={14} />
                            </button>
                            <button
                              onClick={() => updateRow(row.id, 'gainType', 'fixed')}
                              className={`p-1 px-2 rounded-md transition-all ${row.gainType === 'fixed' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                              <DollarSign size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            value={row.gainValue || ''}
                            onChange={(e) => updateRow(row.id, 'gainValue', e.target.value)}
                            className="w-full px-4 py-4 bg-slate-50/50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 transition-all font-bold text-lg"
                            placeholder={row.gainType === 'percent' ? "0%" : "$ 0"}
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                            <span className="text-[10px] font-black uppercase text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                              {row.gainType === 'percent' ? `Equiv. ${formatCurrency(data.gainAmount)}` : `Equiv. ${formatPercent(data.gainPercent)}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Retention Type Selector */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Tipo de Retención</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => updateRow(row.id, 'retentionType', 'venta')}
                            className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-bold border-2 transition-all ${row.retentionType === 'venta' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50/50 border-transparent text-slate-400 hover:bg-slate-100'}`}
                          >
                            <ShoppingBag size={18} />
                            <span className="text-sm">Venta (2.5%)</span>
                          </button>
                          <button
                            onClick={() => updateRow(row.id, 'retentionType', 'servicio')}
                            className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-bold border-2 transition-all ${row.retentionType === 'servicio' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-slate-50/50 border-transparent text-slate-400 hover:bg-slate-100'}`}
                          >
                            <Briefcase size={18} />
                            <span className="text-sm">Servicio (4%)</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Result Card for Row */}
                    <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto shrink-0 border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-8">
                      <div className="text-right space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base + IVA (19%)</p>
                        <p className="text-xl font-bold text-slate-700">{formatCurrency(data.baseMasIva)}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Retención (-{formatPercent(data.retRate)})</p>
                        <p className="text-xl font-bold text-rose-500">-{formatCurrency(data.retVal)}</p>
                      </div>
                      <div className="text-right space-y-1 bg-emerald-50 px-6 py-2 rounded-2xl border border-emerald-100">
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Neto a Recibir</p>
                        <p className="text-2xl font-black text-emerald-700">{formatCurrency(data.netoRecibir)}</p>
                      </div>
                      <button
                        onClick={() => removeRow(row.id)}
                        className="lg:ml-4 text-slate-200 hover:text-rose-400 transition-colors p-2 self-center block"
                      >
                        <Trash size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Floated Sidebar Summary */}
          <div className="lg:col-span-12 xl:col-span-3">
            <div className="sticky top-10 space-y-6">
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-bl-full pointer-events-none"></div>

                <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                  <Receipt className="text-indigo-400" /> Gran Total
                </h3>

                <div className="space-y-6">
                  <div className="flex justify-between items-end border-b border-white/10 pb-4">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Subtotal Base</p>
                      <p className="text-xl font-bold">{formatCurrency(totals.base)}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-end border-b border-white/10 pb-4">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total IVA 19%</p>
                      <p className="text-xl font-bold text-indigo-300">{formatCurrency(totals.iva)}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-end border-b border-white/10 pb-4">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ganancia Proyectada</p>
                      <p className="text-xl font-bold text-emerald-400">{formatCurrency(totals.gain)}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-end border-b border-white/10 pb-4">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Valor de Venta</p>
                      <p className="text-2xl font-black">{formatCurrency(totals.venta)}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Retenciones Totales</p>
                      <p className="text-xl font-bold text-rose-400 mt-1">-{formatCurrency(totals.retention)}</p>
                    </div>
                  </div>

                  <div className="pt-8 mt-4 border-t-4 border-indigo-500">
                    <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em]">Neto Total Recibir</p>
                    <p className="text-5xl font-black tracking-tighter mt-2">{formatCurrency(totals.total)}</p>
                  </div>

                  <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white mt-10 py-5 rounded-2xl font-black transition-all flex items-center justify-center gap-3 group">
                    Emitir Informe
                    <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Tips / Info */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-2">
                  <Percent size={16} className="text-indigo-600" /> Tip Fiscal
                </h4>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  Recuerda que la retención se calcula sobre el Valor de Venta (Base + IVA + Ganancia) según tu selección.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
