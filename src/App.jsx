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
  AlertCircle
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

export default function App() {
  const [rows, setRows] = useState([
    {
      id: Date.now(),
      base_manual: "0",
      gain_mode: "fixed", // "percent" o "fixed"
      gain_manual: "0",
      ret_mode: "venta" // "venta" (2.5%) o "servicio" (4%)
    }
  ]);

  const [isExporting, setIsExporting] = useState(false);
  const pdfRef = useRef();

  const addRow = () => {
    setRows(prev => [...prev, {
      id: Date.now() + Math.random(),
      base_manual: "0",
      gain_mode: "fixed",
      gain_manual: "0",
      ret_mode: "venta"
    }]);
  };

  const deleteRow = (id) => {
    if (rows.length > 1) setRows(prev => prev.filter(r => r.id !== id));
  };

  const update = (id, fields) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...fields } : r));
  };

  // MOTOR DE CÁLCULO CENTRAL - SIN INTERMEDIARIOS
  const processed = useMemo(() => {
    const calculated = rows.map(row => {
      const base = parseFloat(row.base_manual) || 0;
      const iva = base * 0.19;
      const costTotal = base + iva;

      let gain_money = 0;
      let gain_perc = 0;

      if (row.gain_mode === 'percent') {
        gain_perc = (parseFloat(row.gain_manual) || 0) / 100;
        gain_money = costTotal * gain_perc;
      } else {
        gain_money = parseFloat(row.gain_manual) || 0;
        gain_perc = costTotal > 0 ? gain_money / costTotal : 0;
      }

      const sale_total = costTotal + gain_money;
      const ret_rate = row.ret_mode === 'servicio' ? 0.04 : 0.025;
      const ret_money = sale_total * ret_rate;
      const neto_final = sale_total - ret_money;

      return {
        ...row,
        m: { // Metrics
          base,
          iva,
          costTotal,
          gain_money,
          gain_perc,
          sale_total,
          ret_rate,
          ret_money,
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
      neto: acc.neto + curr.m.neto_final
    }), { base: 0, iva: 0, cost: 0, gain: 0, ret: 0, neto: 0 });

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
            {processed.items.map((row) => (
              <div key={row.id} className="bg-white rounded-[3rem] shadow-xl border border-slate-100 p-8 md:p-12 relative overflow-hidden transition-all hover:shadow-2xl">
                <button
                  onClick={() => deleteRow(row.id)}
                  className="absolute top-8 right-8 text-slate-200 hover:text-rose-500 p-2 no-print transition-colors"
                >
                  <Trash2 size={24} />
                </button>

                <div className="space-y-10">
                  {/* Step 1 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest">
                        <ShoppingBag size={18} /> 1. Valor de Compra
                      </div>
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black text-2xl">$</span>
                        <input
                          type="number"
                          value={row.base_manual || ''}
                          onChange={(e) => update(row.id, { base_manual: e.target.value })}
                          className="w-full pl-12 pr-6 py-6 bg-slate-50 border-4 border-transparent rounded-[2rem] focus:bg-white focus:border-indigo-600 text-3xl font-black no-print"
                          placeholder="0"
                        />
                        <div className="hidden print:block text-3xl font-black py-6 px-12 bg-slate-50 rounded-[2rem]">
                          {formatMoney(row.m.base)}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Costo Total + IVA 19%</p>
                      <div className="w-full px-10 py-6 bg-indigo-50 border-2 border-indigo-100 rounded-[2rem] flex justify-between items-center">
                        <span className="text-indigo-400 font-black text-xl">$</span>
                        <span className="text-3xl font-black text-indigo-700">{formatMoney(row.m.costTotal)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100"></div>

                  {/* Step 2 & 3 */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest">
                        <TrendingUp size={18} /> 2. Ganancia
                      </div>
                      <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] no-print">
                        <button
                          onClick={() => update(row.id, { gain_mode: 'percent' })}
                          className={`flex-1 py-3 rounded-xl font-bold ${row.gain_mode === 'percent' ? 'bg-white shadow text-emerald-600' : 'text-slate-400'}`}
                        >
                          PORCENTAJE
                        </button>
                        <button
                          onClick={() => update(row.id, { gain_mode: 'fixed' })}
                          className={`flex-1 py-3 rounded-xl font-bold ${row.gain_mode === 'fixed' ? 'bg-white shadow text-emerald-600' : 'text-slate-400'}`}
                        >
                          MONTO
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          value={row.gain_manual || ''}
                          onChange={(e) => update(row.id, { gain_manual: e.target.value })}
                          className="w-full px-8 py-6 bg-slate-50 border-4 border-transparent rounded-[2rem] focus:bg-white focus:border-emerald-500 text-2xl font-black no-print"
                        />
                        <div className="hidden print:block text-2xl font-black py-6 px-8 bg-slate-50 rounded-[2rem]">
                          {row.gain_mode === 'percent' ? `${row.gain_manual}%` : formatMoney(row.gain_manual)}
                        </div>
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-xl font-black text-[10px]">
                          {row.gain_mode === 'percent' ? `+ ${formatMoney(row.m.gain_money)}` : `+ ${formatPercent(row.m.gain_perc)}`}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest">
                        <Target size={18} /> 3. Retención
                      </div>
                      <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-[1.5rem] no-print">
                        <button
                          onClick={() => update(row.id, { ret_mode: 'venta' })}
                          className={`py-3 rounded-xl font-bold ${row.ret_mode === 'venta' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}
                        >
                          VENTA (2.5%)
                        </button>
                        <button
                          onClick={() => update(row.id, { ret_mode: 'servicio' })}
                          className={`py-3 rounded-xl font-bold ${row.ret_mode === 'servicio' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}
                        >
                          SRVC (4%)
                        </button>
                      </div>

                      {/* Box Resultado */}
                      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-4 shadow-xl border-l-[12px] border-indigo-500">
                        <div className="flex justify-between items-center text-slate-400 font-bold text-[10px] tracking-widest">
                          <span>VENTA BRUTA</span>
                          <span className="text-white font-black">{formatMoney(row.m.sale_total)}</span>
                        </div>
                        <div className="flex justify-between items-center text-rose-400 font-black text-xl">
                          <span>RETENCIÓN ({formatPercent(row.m.ret_rate)})</span>
                          <span>- {formatMoney(row.m.ret_money)}</span>
                        </div>
                        <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">NETO A RECIBIR</span>
                          <span className="text-4xl font-black">{formatMoney(row.m.neto_final)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar */}
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

                  <div className="bg-indigo-800 p-8 rounded-[2rem] border border-white/5 shadow-inner">
                    <p className="text-[10px] font-black tracking-widest text-indigo-300 mb-2 uppercase">Gasto Total de Compra</p>
                    <p className="text-5xl font-black leading-none">{formatMoney(processed.totals.cost)}</p>
                  </div>

                  <div className="grid gap-6 px-4">
                    <div className="flex justify-between items-center text-emerald-300 font-black">
                      <span className="text-xs tracking-widest">UTILIDAD TOTAL</span>
                      <span className="text-3xl">+{formatMoney(processed.totals.gain)}</span>
                    </div>
                    <div className="flex justify-between items-center text-rose-300 font-black">
                      <span className="text-xs tracking-widest">RETENCIONES</span>
                      <span className="text-3xl">-{formatMoney(processed.totals.ret)}</span>
                    </div>
                  </div>

                  <div className="pt-10 mt-6 border-t-8 border-indigo-500 flex flex-col items-center">
                    <p className="text-xs font-black tracking-[0.5em] opacity-60 mb-4 uppercase">RESULTADO NETO TOTAL</p>
                    <p className="text-[4rem] lg:text-[5rem] font-black tracking-tighter leading-none text-center">
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
                  Reporte dinámico para tributación colombiana. La retención se aplica directamente sobre el precio de venta (Costo + Ganancia).
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
