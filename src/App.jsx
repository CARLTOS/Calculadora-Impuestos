import React, { useState, useMemo } from 'react';
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
  TrendingUp,
  Target,
  ChevronDown,
  Info
} from 'lucide-react';

export default function App() {
  const [rows, setRows] = useState([
    {
      id: Date.now(),
      base: 0,
      gainType: 'percent',
      gainValue: 0,
      retentionType: 'venta'
    }
  ]);

  const addRow = () => {
    setRows([...rows, {
      id: Date.now() + Math.random(),
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

  // Cálculo individual por fila con lógica de números explícita
  const getRowMetrics = (row) => {
    const base = Number(row.base) || 0;
    const iva = base * 0.19;
    const costoTotal = base + iva;

    let utilidad = 0;
    let utilPorcentaje = 0;

    if (row.gainType === 'percent') {
      utilPorcentaje = (Number(row.gainValue) || 0) / 100;
      utilidad = costoTotal * utilPorcentaje;
    } else {
      utilidad = Number(row.gainValue) || 0;
      utilPorcentaje = costoTotal > 0 ? utilidad / costoTotal : 0;
    }

    const valorVenta = costoTotal + utilidad;
    const tasaRet = row.retentionType === 'servicio' ? 0.04 : 0.025;
    const valorRet = valorVenta * tasaRet;
    const netoA_Recibir = valorVenta - valorRet;

    return {
      base,
      iva,
      costoTotal,
      utilidad,
      utilPorcentaje,
      valorVenta,
      valorRet,
      tasaRet,
      netoA_Recibir
    };
  };

  // Consolidado total con useMemo para mayor estabilidad
  const totals = useMemo(() => {
    return rows.reduce((acc, row) => {
      const metric = getRowMetrics(row);
      return {
        base: acc.base + metric.base,
        iva: acc.iva + metric.iva,
        costoTotal: acc.costoTotal + metric.costoTotal,
        utilidad: acc.utilidad + metric.utilidad,
        valorVenta: acc.valorVenta + metric.valorVenta,
        retencion: acc.retencion + metric.valorRet,
        neto: acc.neto + metric.netoA_Recibir
      };
    }, { base: 0, iva: 0, costoTotal: 0, utilidad: 0, valorVenta: 0, retencion: 0, neto: 0 });
  }, [rows]);

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900 font-sans selection:bg-indigo-200 antialiased p-4 md:p-12">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 opacity-70">
        <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[45%] bg-blue-200 rounded-full blur-[140px]"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[45%] bg-indigo-200 rounded-full blur-[140px]"></div>
      </div>

      <div className="max-w-[1700px] mx-auto space-y-12">
        {/* Header Section */}
        <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 py-4 px-2">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-100">
              <Calculator size={14} /> Sistema Contable Pro
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-950 leading-[0.9]">
              Calculadora de <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">Costos & Venta</span>
            </h1>
            <p className="text-slate-500 font-semibold text-xl md:text-2xl max-w-3xl leading-relaxed">
              Analiza la rentabilidad real de tu operación incluyendo IVA, utilidad proyectada y retenciones.
            </p>
          </div>

          <button
            onClick={addRow}
            className="flex items-center justify-center gap-4 bg-slate-950 text-white px-12 py-6 rounded-[2.5rem] font-black text-xl shadow-2xl shadow-slate-300 hover:bg-indigo-600 hover:-translate-y-1 transition-all duration-300 active:scale-95 self-start xl:self-center"
          >
            <Plus size={28} />
            <span>Nueva Partida</span>
          </button>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
          {/* Main Content: Row Cards */}
          <div className="xl:col-span-8 space-y-10">
            {rows.map((row, index) => {
              const m = getRowMetrics(row);
              return (
                <div
                  key={row.id}
                  className="bg-white rounded-[3.5rem] shadow-2xl shadow-slate-200/60 border border-white p-8 md:p-14 hover:ring-8 hover:ring-indigo-50 transition-all duration-500 animate-in fade-in slide-in-from-bottom-12 relative overflow-hidden group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Delete Button */}
                  <button
                    onClick={() => removeRow(row.id)}
                    className="absolute top-10 right-10 text-slate-200 hover:text-rose-500 transition-all p-4 rounded-3xl hover:bg-rose-50 z-20"
                    title="Eliminar partida"
                  >
                    <Trash2 size={32} />
                  </button>

                  <div className="relative z-10 space-y-14">
                    {/* Section 1: Purchase & Cost */}
                    <div className="space-y-8">
                      <div className="flex items-center gap-3 text-indigo-600 border-b border-indigo-50 pb-4">
                        <ShoppingBag size={24} className="font-bold shrink-0" />
                        <h3 className="text-lg font-black uppercase tracking-[0.2em] italic">1. Estructura de Costo</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-3">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Valor Base de Compra (Neto)</label>
                          <div className="relative group">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 text-2xl font-black">$</span>
                            <input
                              type="number"
                              value={row.base || ''}
                              onChange={(e) => updateRow(row.id, 'base', e.target.value)}
                              className="w-full pl-12 pr-8 py-7 bg-slate-50 border-4 border-transparent rounded-[2.5rem] focus:bg-white focus:border-indigo-600 transition-all font-black text-4xl shadow-inner"
                              placeholder="0"
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Costo Total (Base + IVA 19%)</label>
                          <div className="w-full px-8 py-7 bg-indigo-50 border-4 border-indigo-100 rounded-[2.5rem] flex items-center justify-between shadow-sm">
                            <span className="text-indigo-600 font-black text-2xl">$</span>
                            <span className="text-4xl font-black text-indigo-800 tracking-tight">{formatCurrency(m.costoTotal)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: GAIN and RETENTION */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                      {/* Gain Column */}
                      <div className="space-y-8">
                        <div className="flex items-center gap-2 text-emerald-600">
                          <TrendingUp size={20} />
                          <h3 className="text-xs font-black uppercase tracking-[0.3em]">2. Margen de Beneficio</h3>
                        </div>

                        <div className="space-y-6">
                          <div className="flex p-2 bg-slate-100 rounded-[2rem] gap-2">
                            <button
                              onClick={() => updateRow(row.id, 'gainType', 'percent')}
                              className={`flex-1 py-4 rounded-[1.5rem] font-black transition-all flex items-center justify-center gap-2 ${row.gainType === 'percent' ? 'bg-white shadow-xl text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                              <Percent size={20} /> <span className="text-sm">PORCENTAJE</span>
                            </button>
                            <button
                              onClick={() => updateRow(row.id, 'gainType', 'fixed')}
                              className={`flex-1 py-4 rounded-[1.5rem] font-black transition-all flex items-center justify-center gap-2 ${row.gainType === 'fixed' ? 'bg-white shadow-xl text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                              <DollarSign size={20} /> <span className="text-sm">MONTO FIJO</span>
                            </button>
                          </div>

                          <div className="relative">
                            <input
                              type="number"
                              value={row.gainValue || ''}
                              onChange={(e) => updateRow(row.id, 'gainValue', e.target.value)}
                              className="w-full px-8 py-7 bg-slate-50 border-4 border-transparent rounded-[2.5rem] focus:bg-white focus:border-emerald-500 transition-all font-black text-3xl shadow-inner"
                              placeholder={row.gainType === 'percent' ? "Ej: 25" : "Ej: 200000"}
                            />
                            <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-3">
                              <span className="bg-emerald-100 text-emerald-700 font-black text-sm px-5 py-2 rounded-2xl border-2 border-emerald-200">
                                {row.gainType === 'percent' ? `+$ ${formatCurrency(m.utilidad)}` : `+ ${formatPercent(m.utilPorcentaje)}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Retention Column */}
                      <div className="space-y-8">
                        <div className="flex items-center gap-2 text-blue-600">
                          <Target size={20} />
                          <h3 className="text-xs font-black uppercase tracking-[0.3em]">3. Retención Aplicada</h3>
                        </div>

                        <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-[1.8rem]">
                            <button
                              onClick={() => updateRow(row.id, 'retentionType', 'venta')}
                              className={`py-4 rounded-[1.4rem] font-black transition-all text-xs flex items-center justify-center gap-2 ${row.retentionType === 'venta' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                              VENTAS (2.5%)
                            </button>
                            <button
                              onClick={() => updateRow(row.id, 'retentionType', 'servicio')}
                              className={`py-4 rounded-[1.4rem] font-black transition-all text-xs flex items-center justify-center gap-2 ${row.retentionType === 'servicio' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                              SERVICIOS (4%)
                            </button>
                          </div>

                          <div className="bg-slate-950 rounded-[2.5rem] p-8 text-white space-y-4 shadow-2xl">
                            <div className="flex justify-between items-center text-slate-400 font-bold text-sm tracking-wider">
                              <span>VALOR VENTA (COSTO + GANANCIA)</span>
                              <span>{formatCurrency(m.valorVenta)}</span>
                            </div>
                            <div className="flex justify-between items-center text-rose-400 font-black text-lg">
                              <span>RETENCIÓN ({formatPercent(m.tasaRet)})</span>
                              <span className="bg-rose-950/50 px-3 py-1 rounded-xl">-{formatCurrency(m.valorRet)}</span>
                            </div>
                            <div className="border-t border-white/10 pt-4 flex justify-between items-center">
                              <span className="text-[10px] font-black tracking-[0.3em] text-indigo-400">NETO A RECIBIR</span>
                              <span className="text-4xl font-black">{formatCurrency(m.netoA_Recibir)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sidebar Consolidate */}
          <div className="xl:col-span-4">
            <div className="sticky top-12 space-y-8">
              <div className="bg-indigo-700 rounded-[3.5rem] p-10 md:p-14 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden backdrop-blur-3xl border border-white/20">
                <div className="absolute top-[-5%] right-[-5%] w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

                <h2 className="text-3xl font-black mb-12 flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-2xl shadow-inner">
                    <Receipt size={28} />
                  </div>
                  Total General
                </h2>

                <div className="space-y-10">
                  <div className="grid gap-6">
                    <div className="flex justify-between items-end border-b border-indigo-500 pb-4">
                      <p className="text-xs font-black text-indigo-300 uppercase tracking-widest tracking-[0.2em]">Suma Base Compra</p>
                      <p className="text-2xl font-black">{formatCurrency(totals.base)}</p>
                    </div>

                    <div className="flex justify-between items-end border-b border-indigo-500 pb-4">
                      <p className="text-xs font-black text-indigo-300 uppercase tracking-widest tracking-[0.2em]">Total IVA (19%)</p>
                      <p className="text-2xl font-black">{formatCurrency(totals.iva)}</p>
                    </div>

                    <div className="bg-indigo-800/60 p-8 rounded-[2.5rem] border border-white/10 shadow-inner">
                      <p className="text-xs font-black text-indigo-300 uppercase tracking-[0.3em] mb-2">COSTO TOTAL OPERACIÓN</p>
                      <p className="text-4xl font-black leading-none">{formatCurrency(totals.costoTotal)}</p>
                    </div>
                  </div>

                  <div className="space-y-5 px-2">
                    <div className="flex justify-between items-center text-emerald-300 pb-3 border-b border-white/5">
                      <span className="text-xs font-black uppercase tracking-widest">UTILIDAD TOTAL</span>
                      <span className="text-3xl font-black">+{formatCurrency(totals.utilidad)}</span>
                    </div>
                    <div className="flex justify-between items-center text-rose-300 pb-3 border-b border-white/5">
                      <span className="text-xs font-black uppercase tracking-widest">RETENCIONES TOTALES</span>
                      <span className="text-3xl font-black">-{formatCurrency(totals.retencion)}</span>
                    </div>
                  </div>

                  <div className="pt-12 mt-4 border-t-8 border-indigo-400 flex flex-col gap-4">
                    <p className="text-xs font-black text-white/60 uppercase tracking-[0.5em] text-center">NETO TOTAL A PERCIBIR</p>
                    <p className="text-[5rem] md:text-[6rem] font-black tracking-tighter leading-none text-center drop-shadow-lg">
                      {formatCurrency(totals.neto)}
                    </p>
                  </div>

                  <button className="w-full bg-slate-950 hover:bg-slate-900 border-2 border-white/10 text-white mt-10 py-7 rounded-[2.5rem] font-black text-2xl transition-all flex items-center justify-center gap-5 shadow-2xl group">
                    Generar Balance
                    <ArrowRight size={28} className="group-hover:translate-x-3 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Informative Label */}
              <div className="bg-white rounded-[2.5rem] p-10 border-4 border-slate-200/50 flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-indigo-50 rounded-3xl text-indigo-600">
                    <Info size={28} />
                  </div>
                  <h4 className="font-black text-slate-950 uppercase tracking-[0.2em] text-sm">Resumen de Cálculo</h4>
                </div>
                <p className="text-slate-500 text-lg leading-relaxed font-semibold">
                  Toda retención se está procesando sobre el monto resultante de <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded-lg">Costo Total + Ganancia seleccionada</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
