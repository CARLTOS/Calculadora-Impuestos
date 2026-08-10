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

  // Manejo de foco para quitar automaticamente el "0" por defecto al hacer clic
  const handleFocusZero = (id, field, currentValue) => {
    if (currentValue === "0" || currentValue === "0.0" || currentValue === 0) {
      update(id, { [field]: "" });
    }
  };

  const handleBlurZero = (id, field, currentValue, defaultValue = "0") => {
    if (currentValue === "" || currentValue === null || currentValue === undefined) {
      update(id, { [field]: defaultValue });
    }
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-3 md:p-6 lg:p-8 selection:bg-indigo-100">
      <div className="max-w-[1600px] mx-auto space-y-6" ref={pdfRef}>

        {/* Header Compacto */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-600 text-white text-[9px] font-black uppercase tracking-[0.15em] shadow">
              <Calculator size={12} /> Gestión de Impuestos Colombia
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-slate-900 leading-none">
              Calculadora <span className="text-indigo-600">Pro</span>
            </h1>
          </div>
          <button
            onClick={addRow}
            className="flex items-center gap-2 bg-slate-950 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-indigo-600 transition-all active:scale-95 no-print shadow-lg"
          >
            <Plus size={18} /> Nueva Partida
          </button>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

          {/* Main Rows */}
          <div className="xl:col-span-8 space-y-5">
            {processed.items.map((row, idx) => (
              <div key={row.id} className="bg-white rounded-3xl shadow-lg border border-slate-100 p-5 md:p-6 relative overflow-hidden transition-all hover:shadow-xl space-y-5">
                
                {/* Header de la fila */}
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-400">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold">{idx + 1}</span>
                    Partida #{idx + 1}
                  </span>
                  {processed.items.length > 1 && (
                    <button
                      onClick={() => deleteRow(row.id)}
                      className="text-slate-300 hover:text-rose-500 p-1.5 no-print transition-colors rounded-lg hover:bg-rose-50"
                      title="Eliminar partida"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                {/* Paso 1: Valor de Compra e IVA */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-wider">
                      <ShoppingBag size={16} /> 1. Valor de Compra e IVA
                    </div>
                    {/* Switch de IVA */}
                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl no-print">
                      <span className="text-[10px] font-bold text-slate-600 ml-1.5">¿Aplica IVA?</span>
                      <button
                        type="button"
                        onClick={() => update(row.id, { has_iva: !row.has_iva })}
                        className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                          row.has_iva ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {row.has_iva ? 'SI' : 'NO'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    {/* Campo Base */}
                    <div className="md:col-span-7 space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1 block">
                        Base Imponible (Sin IVA)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl">$</span>
                        <input
                          type="number"
                          value={row.base_manual || ''}
                          onFocus={() => handleFocusZero(row.id, 'base_manual', row.base_manual)}
                          onBlur={() => handleBlurZero(row.id, 'base_manual', row.base_manual, '0')}
                          onChange={(e) => update(row.id, { base_manual: e.target.value })}
                          className="w-full pl-9 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-600 text-2xl font-black no-print"
                          placeholder="0"
                        />
                        <div className="hidden print:block text-2xl font-black py-3 px-8 bg-slate-50 rounded-2xl">
                          {formatMoney(row.m.base)}
                        </div>
                      </div>
                    </div>

                    {/* Porcentaje de IVA */}
                    <div className="md:col-span-5 space-y-1">
                      <div className="flex justify-between items-center ml-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                          Tasa IVA (%)
                        </label>
                        {!row.has_iva && (
                          <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded">Exento / Excluido</span>
                        )}
                      </div>

                      <div className="relative">
                        <input
                          type="number"
                          disabled={!row.has_iva}
                          value={row.has_iva ? (row.iva_rate ?? '19') : '0'}
                          onFocus={() => handleFocusZero(row.id, 'iva_rate', row.iva_rate)}
                          onBlur={() => handleBlurZero(row.id, 'iva_rate', row.iva_rate, '19')}
                          onChange={(e) => update(row.id, { iva_rate: e.target.value })}
                          className={`w-full px-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl text-xl font-black no-print transition-all ${
                            row.has_iva ? 'focus:bg-white focus:border-indigo-600 text-slate-900' : 'text-slate-300 cursor-not-allowed'
                          }`}
                          placeholder="19"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-base text-slate-400">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Resumen Costo Compra */}
                  <div className="w-full px-5 py-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex flex-wrap justify-between items-center gap-2">
                    <span className="text-xs font-bold text-indigo-900">
                      {row.has_iva ? `IVA (${row.m.iva_rate_val * 100}%): ${formatMoney(row.m.iva)}` : 'Sin IVA aplicado'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Costo Total Compra:</span>
                      <span className="text-xl font-black text-indigo-700">{formatMoney(row.m.costTotal)}</span>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-100"></div>

                {/* Paso 2: Ganancia */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-wider">
                    <TrendingUp size={16} /> 2. Margen de Ganancia
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-5 flex bg-slate-100 p-1 rounded-xl no-print">
                      <button
                        type="button"
                        onClick={() => update(row.id, { gain_mode: 'percent' })}
                        className={`flex-1 py-2 rounded-lg font-bold text-[11px] ${row.gain_mode === 'percent' ? 'bg-white shadow text-emerald-600' : 'text-slate-400'}`}
                      >
                        PORCENTAJE
                      </button>
                      <button
                        type="button"
                        onClick={() => update(row.id, { gain_mode: 'fixed' })}
                        className={`flex-1 py-2 rounded-lg font-bold text-[11px] ${row.gain_mode === 'fixed' ? 'bg-white shadow text-emerald-600' : 'text-slate-400'}`}
                      >
                        MONTO FIJO
                      </button>
                    </div>

                    <div className="md:col-span-7 relative">
                      <input
                        type="number"
                        value={row.gain_manual || ''}
                        onFocus={() => handleFocusZero(row.id, 'gain_manual', row.gain_manual)}
                        onBlur={() => handleBlurZero(row.id, 'gain_manual', row.gain_manual, '0')}
                        onChange={(e) => update(row.id, { gain_manual: e.target.value })}
                        className="w-full px-5 py-3 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 text-xl font-black no-print"
                        placeholder="0"
                      />
                      <div className="hidden print:block text-xl font-black py-3 px-5 bg-slate-50 rounded-2xl">
                        {row.gain_mode === 'percent' ? `${row.gain_manual}%` : formatMoney(row.gain_manual)}
                      </div>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg font-black text-xs">
                        {row.gain_mode === 'percent' ? `+ ${formatMoney(row.m.gain_money)}` : `+ ${formatPercent(row.m.gain_perc)}`}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-100"></div>

                {/* Paso 3: Retenciones Tributarias (Grid 2 columnas en Desktop para optimizar espacio) */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-wider">
                    <Target size={16} /> 3. Retenciones Tributarias
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Bloque Retención en la Fuente */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-black text-xs text-slate-800">
                          <Building2 size={15} className="text-blue-600" />
                          ReteFuente
                        </div>
                        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 no-print">
                          <span className="text-[10px] font-bold text-slate-500 ml-1">¿Aplica?</span>
                          <button
                            type="button"
                            onClick={() => update(row.id, { has_ret: !row.has_ret })}
                            className={`px-3 py-1 rounded-lg text-[11px] font-black transition-all ${
                              row.has_ret ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-200 text-slate-500'
                            }`}
                          >
                            {row.has_ret ? 'SI' : 'NO'}
                          </button>
                        </div>
                      </div>

                      {row.has_ret && (
                        <div className="space-y-3 pt-1">
                          <div className="flex justify-between items-center no-print">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                              Configuración
                            </span>
                            <button
                              type="button"
                              onClick={() => update(row.id, { ret_custom_mode: !row.ret_custom_mode })}
                              className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-1"
                            >
                              <Sliders size={11} />
                              {row.ret_custom_mode ? 'Ver Perfiles' : '% Manual'}
                            </button>
                          </div>

                          {!row.ret_custom_mode ? (
                            <div className="space-y-2 no-print">
                              <div className="grid grid-cols-2 gap-1.5 bg-white p-1 rounded-xl border border-slate-200">
                                <button
                                  type="button"
                                  onClick={() => update(row.id, { ret_perfil: 'declarante' })}
                                  className={`py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                    row.ret_perfil !== 'no_declarante' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-900'
                                  }`}
                                >
                                  Declarante
                                </button>
                                <button
                                  type="button"
                                  onClick={() => update(row.id, { ret_perfil: 'no_declarante' })}
                                  className={`py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                    row.ret_perfil === 'no_declarante' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-900'
                                  }`}
                                >
                                  No Declarante
                                </button>
                              </div>

                              <div className="grid grid-cols-2 gap-1.5 bg-white p-1 rounded-xl border border-slate-200">
                                <button
                                  type="button"
                                  onClick={() => update(row.id, { ret_tipo: 'venta' })}
                                  className={`py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                    row.ret_tipo === 'venta' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-900'
                                  }`}
                                >
                                  Venta ({row.ret_perfil === 'no_declarante' ? '3.5%' : '2.5%'})
                                </button>
                                <button
                                  type="button"
                                  onClick={() => update(row.id, { ret_tipo: 'servicio' })}
                                  className={`py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                    row.ret_tipo === 'servicio' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-900'
                                  }`}
                                >
                                  Servicio ({row.ret_perfil === 'no_declarante' ? '6%' : '4%'})
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="no-print">
                              <div className="relative">
                                <input
                                  type="number"
                                  step="0.1"
                                  value={row.ret_custom_rate || ''}
                                  onFocus={() => handleFocusZero(row.id, 'ret_custom_rate', row.ret_custom_rate)}
                                  onBlur={() => handleBlurZero(row.id, 'ret_custom_rate', row.ret_custom_rate, '2.5')}
                                  onChange={(e) => update(row.id, { ret_custom_rate: e.target.value })}
                                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl font-black text-lg text-slate-900 focus:border-blue-600"
                                  placeholder="2.5"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400">%</span>
                              </div>
                            </div>
                          )}

                          <div className="inline-flex items-center gap-1.5 bg-blue-100/60 text-blue-800 px-3 py-1 rounded-lg text-[11px] font-black">
                            <Check size={13} /> Tasa: {formatPercent(row.m.ret_rate)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bloque Retención de ICA (ReteICA) */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-black text-xs text-slate-800">
                          <Percent size={15} className="text-purple-600" />
                          ReteICA
                        </div>
                        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 no-print">
                          <span className="text-[10px] font-bold text-slate-500 ml-1">¿Aplica?</span>
                          <button
                            type="button"
                            onClick={() => update(row.id, { has_ica: !row.has_ica })}
                            className={`px-3 py-1 rounded-lg text-[11px] font-black transition-all ${
                              row.has_ica ? 'bg-purple-600 text-white shadow-sm' : 'bg-slate-200 text-slate-500'
                            }`}
                          >
                            {row.has_ica ? 'SI' : 'NO'}
                          </button>
                        </div>
                      </div>

                      {row.has_ica && (
                        <div className="space-y-3 pt-1">
                          <div className="space-y-2 no-print">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                              Tarifa por mil (‰)
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                step="0.01"
                                value={row.ica_rate_promil || ''}
                                onFocus={() => handleFocusZero(row.id, 'ica_rate_promil', row.ica_rate_promil)}
                                onBlur={() => handleBlurZero(row.id, 'ica_rate_promil', row.ica_rate_promil, '11.04')}
                                onChange={(e) => update(row.id, { ica_rate_promil: e.target.value })}
                                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl font-black text-lg text-slate-900 focus:border-purple-600"
                                placeholder="11.04"
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-xs text-purple-600">x1000</span>
                            </div>

                            <div className="flex flex-wrap gap-1 pt-1">
                              {['11.04', '9.66', '7.0', '4.14'].map(t => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => update(row.id, { ica_rate_promil: t })}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                                    row.ica_rate_promil === t ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300'
                                  }`}
                                >
                                  {t}‰
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="inline-flex items-center gap-1.5 bg-purple-100/60 text-purple-800 px-3 py-1 rounded-lg text-[11px] font-black">
                            <Check size={13} /> Tasa ICA: {row.m.ica_promil}‰ ({formatPercent(row.m.ica_rate)})
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Box Resultado Partida Compacto */}
                  <div className="bg-slate-900 rounded-2xl p-5 text-white space-y-4 shadow-md border-l-[8px] border-indigo-500">
                    <div className="flex flex-wrap justify-between items-end gap-2">
                      <div>
                        <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest block">
                          VALOR DE VENTA REQUERIDO
                        </span>
                        <span className="text-3xl md:text-4xl font-black text-white block tracking-tight">
                          {formatMoney(row.m.sale_total)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block">NETO A RECIBIR</span>
                        <span className="text-2xl md:text-3xl font-black text-emerald-300">{formatMoney(row.m.neto_final)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 pt-3 border-t border-white/10 text-xs font-bold">
                      {row.m.has_ret && (
                        <span className="text-rose-400">
                          ReteFuente ({formatPercent(row.m.ret_rate)}): <strong className="font-black">-{formatMoney(row.m.ret_money)}</strong>
                        </span>
                      )}
                      {row.m.has_ica && (
                        <span className="text-purple-300">
                          ReteICA ({row.m.ica_promil}‰): <strong className="font-black">-{formatMoney(row.m.ica_money)}</strong>
                        </span>
                      )}
                      {!row.m.has_ret && !row.m.has_ica && (
                        <span className="text-slate-400 text-xs">Sin retenciones aplicadas</span>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            ))}
          </div>

          {/* Sidebar Consolidado Compacto */}
          <div className="xl:col-span-4 no-print">
            <div className="sticky top-6 space-y-6">
              <div className="bg-indigo-700 rounded-3xl p-6 lg:p-8 text-white shadow-xl relative overflow-hidden border border-white/10">
                <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>

                <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                  <Receipt size={22} /> Consolidado
                </h2>

                <div className="space-y-6 relative z-10">
                  <div className="space-y-3 border-b border-indigo-500 pb-5 text-indigo-100 uppercase text-[10px] font-black tracking-wider">
                    <div className="flex justify-between items-center">
                      <span>Base Neta</span>
                      <span className="text-xl font-black text-white">{formatMoney(processed.totals.base)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>IVA Total</span>
                      <span className="text-xl font-black text-white">{formatMoney(processed.totals.iva)}</span>
                    </div>
                  </div>

                  <div className="bg-indigo-800 p-5 rounded-2xl border border-white/5 shadow-inner space-y-4">
                    <div>
                      <p className="text-[9px] font-black tracking-wider text-indigo-300 mb-1 uppercase">Gasto Total de Compra</p>
                      <p className="text-3xl font-black leading-none">{formatMoney(processed.totals.cost)}</p>
                    </div>
                    <div className="pt-4 border-t border-white/10">
                      <p className="text-[9px] font-black tracking-wider text-indigo-300 mb-1 uppercase">Venta Total Requerida</p>
                      <p className="text-3xl font-black leading-none text-emerald-300">{formatMoney(processed.totals.sale)}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 text-xs">
                    <div className="flex justify-between items-center text-emerald-300 font-black">
                      <span className="text-[10px] tracking-wider uppercase">UTILIDAD TOTAL</span>
                      <span className="text-xl">+{formatMoney(processed.totals.gain)}</span>
                    </div>
                    <div className="flex justify-between items-center text-rose-300 font-bold">
                      <span className="text-[10px] tracking-wider uppercase">ReteFuente Total</span>
                      <span className="text-lg">-{formatMoney(processed.totals.ret)}</span>
                    </div>
                    <div className="flex justify-between items-center text-purple-300 font-bold">
                      <span className="text-[10px] tracking-wider uppercase">ReteICA Total</span>
                      <span className="text-lg">-{formatMoney(processed.totals.ica)}</span>
                    </div>
                  </div>

                  <div className="pt-6 mt-4 border-t-4 border-indigo-500 flex flex-col items-center">
                    <p className="text-[10px] font-black tracking-[0.2em] opacity-60 mb-2 uppercase">RESULTADO NETO TOTAL</p>
                    <p className="text-3xl lg:text-4xl font-black tracking-tight leading-none text-center">
                      {formatMoney(processed.totals.neto)}
                    </p>
                  </div>

                  <button
                    onClick={handlePDF}
                    className="w-full bg-slate-900 hover:bg-black text-white mt-8 py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-xl group"
                  >
                    <Download size={22} className="group-hover:translate-y-0.5 transition-transform" />
                    Descargar Informe
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex gap-3 items-start">
                <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 shrink-0"><Info size={20} /></div>
                <p className="text-slate-500 text-xs font-bold leading-relaxed">
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
          body { background: white !important; padding: 5mm !important; }
          .shadow-xl, .shadow-2xl, .shadow-lg { box-shadow: none !important; border: 1px solid #ddd !important; }
        }
        input::-webkit-outer-spin-button, 
        input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>
    </div>
  );
}


