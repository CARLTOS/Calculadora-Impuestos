import React, { useState, useMemo, useRef } from 'react';
import {
  Plus,
  Trash2,
  Calculator,
  Receipt,
  ShoppingBag,
  TrendingUp,
  Target,
  Info,
  Download,
  Percent,
  Building2,
  Check,
  Sliders
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Utilidad de formateo global para asegurar consistencia
const formatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

const formatMoney = (v) => formatter.format(Math.round(Number(v) || 0));
const formatPercent = (v) => `${(Number(v) * 100).toFixed(2)}%`;

const createNewRow = () => ({
  id: Date.now() + Math.random(),
  base_manual: "0",
  has_iva: true,
  iva_rate: "19",
  gain_mode: "fixed", // "percent" o "fixed"
  gain_manual: "0",
  has_ret: true,
  ret_perfil: "declarante", // "declarante" o "no_declarante"
  ret_tipo: "venta", // "venta" o "servicio"
  ret_custom_mode: false,
  ret_custom_rate: "2.5",
  has_ica: false,
  ica_rate_promil: "11.04" // por mil (‰)
});

export default function App() {
  const [rows, setRows] = useState([createNewRow()]);

  const [isExporting, setIsExporting] = useState(false);
  const pdfRef = useRef();

  const addRow = () => {
    setRows(prev => [...prev, createNewRow()]);
  };

  const deleteRow = (id) => {
    if (rows.length > 1) setRows(prev => prev.filter(r => r.id !== id));
  };

  const update = (id, fields) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...fields } : r));
  };

  // MOTOR DE CÁLCULO CENTRAL
  const processed = useMemo(() => {
    const calculated = rows.map(row => {
      const base = parseFloat(row.base_manual) || 0;
      
      // 1. IVA
      const has_iva = row.has_iva !== false;
      const iva_rate_val = (parseFloat(row.iva_rate) >= 0 ? parseFloat(row.iva_rate) : 19) / 100;
      const iva = has_iva ? base * iva_rate_val : 0;
      const costTotal = base + iva;

      // 2. GANANCIA
      let gain_money = 0;
      let gain_perc = 0;

      if (row.gain_mode === 'percent') {
        gain_perc = (parseFloat(row.gain_manual) || 0) / 100;
        gain_money = costTotal * gain_perc;
      } else {
        gain_money = parseFloat(row.gain_manual) || 0;
        gain_perc = costTotal > 0 ? gain_money / costTotal : 0;
      }

      // 3. RETENCIÓN EN LA FUENTE (ReteFuente)
      const has_ret = row.has_ret !== false;
      let ret_rate = 0;
      if (has_ret) {
        if (row.ret_custom_mode) {
          ret_rate = (parseFloat(row.ret_custom_rate) || 0) / 100;
        } else {
          const isDeclarante = row.ret_perfil !== 'no_declarante';
          const isServicio = row.ret_tipo === 'servicio';
          if (isServicio) {
            ret_rate = isDeclarante ? 0.04 : 0.06;
          } else {
            ret_rate = isDeclarante ? 0.025 : 0.035;
          }
        }
      }

      // 4. RETENCIÓN DE ICA (ReteICA)
      const has_ica = Boolean(row.has_ica);
      const ica_promil = parseFloat(row.ica_rate_promil) || 0;
      const ica_rate = has_ica ? (ica_promil / 1000) : 0;

      // GROSS-UP VENTA TOTAL
      // sale_total - ret_money - ica_money = costTotal + gain_money
      // ret_money = sale_total * ret_rate
      // ica_money = sale_total * ica_rate
      const net_target = costTotal + gain_money;
      const total_ret_rate = ret_rate + ica_rate;
      const divisor = 1 - total_ret_rate;
      const sale_total = divisor > 0 ? net_target / divisor : net_target;

      const ret_money = sale_total * ret_rate;
      const ica_money = sale_total * ica_rate;
      const neto_final = sale_total - ret_money - ica_money;

      return {
        ...row,
        m: {
          base,
          has_iva,
          iva_rate_val,
          iva,
          costTotal,
          gain_money,
          gain_perc,
          has_ret,
          ret_rate,
          ret_money,
          has_ica,
          ica_promil,
          ica_rate,
          ica_money,
          total_ret_rate,
          sale_total,
          neto_final
        }
      };
    });

    const totals = calculated.reduce((acc, curr) => ({
      base: acc.base + curr.m.base,
      iva: acc.iva + curr.m.iva,
      cost: acc.cost + curr.m.costTotal,
      gain: acc.gain + curr.m.gain_money,
      ret: acc.ret + curr.m.ret_money,
      ica: acc.ica + curr.m.ica_money,
      total_ret: acc.total_ret + curr.m.ret_money + curr.m.ica_money,
      neto: acc.neto + curr.m.neto_final,
      sale: acc.sale + curr.m.sale_total
    }), { base: 0, iva: 0, cost: 0, gain: 0, ret: 0, ica: 0, total_ret: 0, neto: 0, sale: 0 });

    return { items: calculated, totals };
  }, [rows]);

  const handlePDF = async () => {
    try {
      setIsExporting(true);
      const canvas = await html2canvas(pdfRef.current, { scale: 2 });
      const img = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const w = 210;
      const h = (canvas.height * w) / canvas.width;
      pdf.addImage(img, 'PNG', 0, 0, w, h);
      pdf.save('Reporte-Costos.pdf');
    } catch (e) {
      alert("Error al generar PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8 xl:p-12 selection:bg-indigo-100">
      <div className="max-w-[1600px] mx-auto space-y-12" ref={pdfRef}>

        {/* Header */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 pb-6 border-b border-slate-200">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">
              <Calculator size={14} /> Gestión de Impuestos Colombia
            </div>
            <h1 className="text-5xl lg:text-7xl font-black tracking-tighter text-slate-900 leading-none">
              Calculadora <span className="text-indigo-600">Pro</span>
            </h1>
          </div>
          <button
            onClick={addRow}
            className="flex items-center gap-4 bg-slate-950 text-white px-10 py-5 rounded-[2rem] font-black text-xl hover:bg-indigo-600 transition-all active:scale-95 no-print shadow-xl"
          >
            <Plus size={24} /> Nueva Partida
          </button>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">

          {/* Main Rows */}
          <div className="xl:col-span-8 space-y-8">
            {processed.items.map((row, idx) => (
              <div key={row.id} className="bg-white rounded-[3rem] shadow-xl border border-slate-100 p-8 md:p-12 relative overflow-hidden transition-all hover:shadow-2xl space-y-10">
                
                {/* Header de la fila */}
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[11px] font-bold">{idx + 1}</span>
                    Partida #{idx + 1}
                  </span>
                  {processed.items.length > 1 && (
                    <button
                      onClick={() => deleteRow(row.id)}
                      className="text-slate-300 hover:text-rose-500 p-2 no-print transition-colors rounded-xl hover:bg-rose-50"
                      title="Eliminar partida"
                    >
                      <Trash2 size={22} />
                    </button>
                  )}
                </div>

                {/* Paso 1: Valor de Compra e IVA */}
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest">
                      <ShoppingBag size={18} /> 1. Valor de Compra e IVA
                    </div>
                    {/* Switch de IVA */}
                    <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-2xl no-print">
                      <span className="text-[11px] font-bold text-slate-600 ml-2">¿Aplica IVA?</span>
                      <button
                        type="button"
                        onClick={() => update(row.id, { has_iva: !row.has_iva })}
                        className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
                          row.has_iva ? 'bg-indigo-600 text-white shadow' : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {row.has_iva ? 'SI' : 'NO'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    {/* Campo Base */}
                    <div className="md:col-span-6 space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">
                        Base Imponible (Sin IVA)
                      </label>
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black text-2xl">$</span>
                        <input
                          type="number"
                          value={row.base_manual || ''}
                          onChange={(e) => update(row.id, { base_manual: e.target.value })}
                          className="w-full pl-12 pr-6 py-5 bg-slate-50 border-4 border-transparent rounded-[2rem] focus:bg-white focus:border-indigo-600 text-3xl font-black no-print"
                          placeholder="0"
                        />
                        <div className="hidden print:block text-3xl font-black py-5 px-12 bg-slate-50 rounded-[2rem]">
                          {formatMoney(row.m.base)}
                        </div>
                      </div>
                    </div>

                    {/* Porcentaje de IVA */}
                    <div className="md:col-span-6 space-y-2">
                      <div className="flex justify-between items-center ml-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Tasa IVA
                        </label>
                        {!row.has_iva && (
                          <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md">Exento / Excluido</span>
                        )}
                      </div>

                      <div className="relative">
                        <input
                          type="number"
                          disabled={!row.has_iva}
                          value={row.has_iva ? (row.iva_rate ?? '19') : '0'}
                          onChange={(e) => update(row.id, { iva_rate: e.target.value })}
                          className={`w-full px-6 py-5 bg-slate-50 border-4 border-transparent rounded-[2rem] text-2xl font-black no-print transition-all ${
                            row.has_iva ? 'focus:bg-white focus:border-indigo-600 text-slate-900' : 'text-slate-300 cursor-not-allowed'
                          }`}
                          placeholder="19"
                        />
                        <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-xl text-slate-400">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Resumen Costo Compra */}
                  <div className="w-full px-8 py-5 bg-indigo-50/70 border-2 border-indigo-100 rounded-[2rem] flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold text-indigo-900">
                        {row.has_iva ? `IVA (${row.m.iva_rate_val * 100}%): ${formatMoney(row.m.iva)}` : 'Sin IVA aplicado'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Costo Total Compra:</span>
                      <span className="text-2xl font-black text-indigo-700">{formatMoney(row.m.costTotal)}</span>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-100"></div>

                {/* Paso 2: Ganancia */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest">
                    <TrendingUp size={18} /> 2. Margen de Ganancia
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    <div className="md:col-span-5 flex bg-slate-100 p-1.5 rounded-[1.5rem] no-print">
                      <button
                        type="button"
                        onClick={() => update(row.id, { gain_mode: 'percent' })}
                        className={`flex-1 py-3 rounded-xl font-bold text-xs ${row.gain_mode === 'percent' ? 'bg-white shadow text-emerald-600' : 'text-slate-400'}`}
                      >
                        PORCENTAJE
                      </button>
                      <button
                        type="button"
                        onClick={() => update(row.id, { gain_mode: 'fixed' })}
                        className={`flex-1 py-3 rounded-xl font-bold text-xs ${row.gain_mode === 'fixed' ? 'bg-white shadow text-emerald-600' : 'text-slate-400'}`}
                      >
                        MONTO FIJO
                      </button>
                    </div>

                    <div className="md:col-span-7 relative">
                      <input
                        type="number"
                        value={row.gain_manual || ''}
                        onChange={(e) => update(row.id, { gain_manual: e.target.value })}
                        className="w-full px-8 py-5 bg-slate-50 border-4 border-transparent rounded-[2rem] focus:bg-white focus:border-emerald-500 text-2xl font-black no-print"
                        placeholder="0"
                      />
                      <div className="hidden print:block text-2xl font-black py-5 px-8 bg-slate-50 rounded-[2rem]">
                        {row.gain_mode === 'percent' ? `${row.gain_manual}%` : formatMoney(row.gain_manual)}
                      </div>
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-xl font-black text-xs">
                        {row.gain_mode === 'percent' ? `+ ${formatMoney(row.m.gain_money)}` : `+ ${formatPercent(row.m.gain_perc)}`}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-100"></div>

                {/* Paso 3: Retenciones (ReteFuente + ReteICA) */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest">
                      <Target size={18} /> 3. Retenciones Tributarias
                    </div>
                  </div>

                  {/* Bloque Retención en la Fuente */}
                  <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-200/80 space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-2 font-black text-sm text-slate-800">
                        <Building2 size={18} className="text-blue-600" />
                        Retención en la Fuente (ReteFuente)
                      </div>
                      <div className="flex items-center gap-3 bg-white p-1 rounded-2xl border border-slate-200 no-print">
                        <span className="text-[11px] font-bold text-slate-600 ml-2">¿Aplica ReteFuente?</span>
                        <button
                          type="button"
                          onClick={() => update(row.id, { has_ret: !row.has_ret })}
                          className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
                            row.has_ret ? 'bg-blue-600 text-white shadow' : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {row.has_ret ? 'SI' : 'NO'}
                        </button>
                      </div>
                    </div>

                    {row.has_ret && (
                      <div className="space-y-4 pt-2">
                        {/* Selector de Modo Custom o Estándar */}
                        <div className="flex justify-between items-center no-print">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Configuración de Tasa
                          </span>
                          <button
                            type="button"
                            onClick={() => update(row.id, { ret_custom_mode: !row.ret_custom_mode })}
                            className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
                          >
                            <Sliders size={12} />
                            {row.ret_custom_mode ? 'Usar Selección de Perfil' : 'Ingresar % Personalizado'}
                          </button>
                        </div>

                        {!row.ret_custom_mode ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 no-print">
                            {/* Perfil persona natural */}
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                                Perfil Contribuyente
                              </label>
                              <div className="grid grid-cols-2 gap-2 bg-white p-1.5 rounded-2xl border border-slate-200">
                                <button
                                  type="button"
                                  onClick={() => update(row.id, { ret_perfil: 'declarante' })}
                                  className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                                    row.ret_perfil !== 'no_declarante' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-900'
                                  }`}
                                >
                                  Declarante
                                </button>
                                <button
                                  type="button"
                                  onClick={() => update(row.id, { ret_perfil: 'no_declarante' })}
                                  className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                                    row.ret_perfil === 'no_declarante' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-900'
                                  }`}
                                >
                                  No Declarante
                                </button>
                              </div>
                            </div>

                            {/* Tipo de Actividad */}
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                                Tipo de Operación
                              </label>
                              <div className="grid grid-cols-2 gap-2 bg-white p-1.5 rounded-2xl border border-slate-200">
                                <button
                                  type="button"
                                  onClick={() => update(row.id, { ret_tipo: 'venta' })}
                                  className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                                    row.ret_tipo === 'venta' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-900'
                                  }`}
                                >
                                  Venta ({row.ret_perfil === 'no_declarante' ? '3.5%' : '2.5%'})
                                </button>
                                <button
                                  type="button"
                                  onClick={() => update(row.id, { ret_tipo: 'servicio' })}
                                  className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                                    row.ret_tipo === 'servicio' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-900'
                                  }`}
                                >
                                  Servicio ({row.ret_perfil === 'no_declarante' ? '6%' : '4%'})
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Campo Custom */
                          <div className="space-y-2 no-print">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                              Porcentaje de Retención Personalizado
                            </label>
                            <div className="relative max-w-xs">
                              <input
                                type="number"
                                step="0.1"
                                value={row.ret_custom_rate || ''}
                                onChange={(e) => update(row.id, { ret_custom_rate: e.target.value })}
                                className="w-full px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl font-black text-xl text-slate-900 focus:border-blue-600"
                                placeholder="2.5"
                              />
                              <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-400">%</span>
                            </div>
                          </div>
                        )}

                        <div className="inline-flex items-center gap-2 bg-blue-100/60 text-blue-800 px-4 py-2 rounded-xl text-xs font-black">
                          <Check size={14} /> Tasa Aplicada: {formatPercent(row.m.ret_rate)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bloque Retención de ICA (ReteICA) */}
                  <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-200/80 space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-2 font-black text-sm text-slate-800">
                        <Percent size={18} className="text-purple-600" />
                        Retención de ICA (ReteICA)
                      </div>
                      <div className="flex items-center gap-3 bg-white p-1 rounded-2xl border border-slate-200 no-print">
                        <span className="text-[11px] font-bold text-slate-600 ml-2">¿Aplica ReteICA?</span>
                        <button
                          type="button"
                          onClick={() => update(row.id, { has_ica: !row.has_ica })}
                          className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
                            row.has_ica ? 'bg-purple-600 text-white shadow' : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {row.has_ica ? 'SI' : 'NO'}
                        </button>
                      </div>
                    </div>

                    {row.has_ica && (
                      <div className="space-y-4 pt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center no-print">
                          <div className="sm:col-span-6 space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                              Tarifa por mil (‰)
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                step="0.01"
                                value={row.ica_rate_promil || ''}
                                onChange={(e) => update(row.id, { ica_rate_promil: e.target.value })}
                                className="w-full px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl font-black text-xl text-slate-900 focus:border-purple-600"
                                placeholder="11.04"
                              />
                              <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-purple-600">x1000</span>
                            </div>
                          </div>

                          <div className="sm:col-span-6 space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                              Tarifas Comunes
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {['11.04', '9.66', '7.0', '4.14'].map(t => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => update(row.id, { ica_rate_promil: t })}
                                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                                    row.ica_rate_promil === t ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300'
                                  }`}
                                >
                                  {t}‰
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="inline-flex items-center gap-2 bg-purple-100/60 text-purple-800 px-4 py-2 rounded-xl text-xs font-black">
                          <Check size={14} /> Tasa ICA: {row.m.ica_promil}‰ ({formatPercent(row.m.ica_rate)})
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Box Resultado Partida */}
                  <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6 shadow-xl border-l-[12px] border-indigo-500">
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] block">
                        VALOR DE VENTA REQUERIDO
                      </span>
                      <span className="text-4xl md:text-5xl font-black text-white block tracking-tight">
                        {formatMoney(row.m.sale_total)}
                      </span>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-white/10">
                      {row.m.has_ret && (
                        <div className="flex justify-between items-center text-rose-400 font-bold text-sm">
                          <span>ReteFuente ({formatPercent(row.m.ret_rate)})</span>
                          <span className="font-black">- {formatMoney(row.m.ret_money)}</span>
                        </div>
                      )}
                      {row.m.has_ica && (
                        <div className="flex justify-between items-center text-purple-300 font-bold text-sm">
                          <span>ReteICA ({row.m.ica_promil}‰ / {formatPercent(row.m.ica_rate)})</span>
                          <span className="font-black">- {formatMoney(row.m.ica_money)}</span>
                        </div>
                      )}
                      {!row.m.has_ret && !row.m.has_ica && (
                        <div className="text-slate-400 text-xs font-bold">Sin retenciones aplicadas</div>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-emerald-400 font-black text-2xl pt-4 border-t border-white/10">
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">NETO A RECIBIR</span>
                      <span>{formatMoney(row.m.neto_final)}</span>
                    </div>
                  </div>

                </div>

              </div>
            ))}
          </div>

          {/* Sidebar Consolidado */}
          <div className="xl:col-span-4 no-print">
            <div className="sticky top-10 space-y-8">
              <div className="bg-indigo-700 rounded-[3rem] p-10 lg:p-12 text-white shadow-2xl relative overflow-hidden border border-white/10">
                <div className="absolute -top-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

                <h2 className="text-3xl font-black mb-10 flex items-center gap-4">
                  <Receipt size={28} /> Consolidado
                </h2>

                <div className="space-y-8 relative z-10">
                  <div className="space-y-4 border-b border-indigo-500 pb-8 text-indigo-100 uppercase text-[10px] font-black tracking-widest">
                    <div className="flex justify-between items-center">
                      <span>Base Neta</span>
                      <span className="text-2xl font-black text-white">{formatMoney(processed.totals.base)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>IVA Total</span>
                      <span className="text-2xl font-black text-white">{formatMoney(processed.totals.iva)}</span>
                    </div>
                  </div>

                  <div className="bg-indigo-800 p-8 rounded-[2rem] border border-white/5 shadow-inner space-y-6">
                    <div>
                      <p className="text-[10px] font-black tracking-widest text-indigo-300 mb-2 uppercase">Gasto Total de Compra</p>
                      <p className="text-4xl font-black leading-none">{formatMoney(processed.totals.cost)}</p>
                    </div>
                    <div className="pt-6 border-t border-white/10">
                      <p className="text-[10px] font-black tracking-widest text-indigo-300 mb-2 uppercase">Venta Total Requerida</p>
                      <p className="text-4xl font-black leading-none text-emerald-300">{formatMoney(processed.totals.sale)}</p>
                    </div>
                  </div>

                  <div className="grid gap-4 px-2 text-sm">
                    <div className="flex justify-between items-center text-emerald-300 font-black">
                      <span className="text-xs tracking-widest uppercase">UTILIDAD TOTAL</span>
                      <span className="text-2xl">+{formatMoney(processed.totals.gain)}</span>
                    </div>
                    <div className="flex justify-between items-center text-rose-300 font-bold">
                      <span className="text-xs tracking-widest uppercase">ReteFuente Total</span>
                      <span className="text-xl">-{formatMoney(processed.totals.ret)}</span>
                    </div>
                    <div className="flex justify-between items-center text-purple-300 font-bold">
                      <span className="text-xs tracking-widest uppercase">ReteICA Total</span>
                      <span className="text-xl">-{formatMoney(processed.totals.ica)}</span>
                    </div>
                  </div>

                  <div className="pt-8 mt-6 border-t-8 border-indigo-500 flex flex-col items-center">
                    <p className="text-xs font-black tracking-[0.3em] opacity-60 mb-4 uppercase">RESULTADO NETO TOTAL</p>
                    <p className="text-4xl lg:text-5xl font-black tracking-tighter leading-none text-center">
                      {formatMoney(processed.totals.neto)}
                    </p>
                  </div>

                  <button
                    onClick={handlePDF}
                    className="w-full bg-slate-900 hover:bg-black text-white mt-12 py-7 rounded-[2rem] font-black text-2xl transition-all flex items-center justify-center gap-5 shadow-2xl group"
                  >
                    <Download size={28} className="group-hover:translate-y-1 transition-transform" />
                    Descargar Informe
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm flex gap-4 items-start">
                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><Info size={24} /></div>
                <p className="text-slate-500 text-sm font-bold leading-relaxed">
                  Cálculos adaptados para la tributación en Colombia. Permite ajustar IVA, Retención en la fuente (2.5%, 3.5%, 4%, 6% o personalizado) y ReteICA (en por mil ‰).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; padding: 10mm !important; }
          .shadow-xl, .shadow-2xl { box-shadow: none !important; border: 1px solid #ddd !important; }
        }
        input::-webkit-outer-spin-button, 
        input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>
    </div>
  );
}

