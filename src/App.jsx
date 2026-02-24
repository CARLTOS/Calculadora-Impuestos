import React, { useState, useMemo, useRef } from 'react';
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
  Info,
  Download
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function App() {
  const [rows, setRows] = useState([
    {
      id: Date.now(),
      base_input: 0,
      gain_type: 'percent', // 'percent' or 'fixed'
      gain_input: 0,
      ret_type: 'venta' // 'venta' (2.5%) or 'servicio' (4%)
    }
  ]);

  const reportRef = useRef();

  const addRow = () => {
    setRows([...rows, {
      id: Date.now() + Math.random(),
      base_input: 0,
      gain_type: 'percent',
      gain_input: 0,
      ret_type: 'venta'
    }]);
  };

  const removeRow = (id) => {
    if (rows.length > 1) {
      setRows(rows.filter(row => row.id !== id));
    }
  };

  const updateRow = (id, field, value) => {
    setRows(rows.map(row => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const formatCurrency = (val) => {
    const n = Number(val) || 0;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(n);
  };

  const formatPercent = (dec) => {
    return `${(dec * 100).toFixed(2)}%`;
  };

  // Función de cálculo pura y robusta
  const processRow = (row) => {
    const raw_base = Number(row.base_input) || 0;
    const calc_iva = raw_base * 0.19;
    const calc_cost_compra = raw_base + calc_iva;

    let calc_gain_money = 0;
    let calc_gain_percent = 0;

    if (row.gain_type === 'percent') {
      calc_gain_percent = (Number(row.gain_input) || 0) / 100;
      calc_gain_money = calc_cost_compra * calc_gain_percent;
    } else {
      calc_gain_money = Number(row.gain_input) || 0;
      calc_gain_percent = calc_cost_compra > 0 ? calc_gain_money / calc_cost_compra : 0;
    }

    const calc_venta_price = calc_cost_compra + calc_gain_money;
    const calc_ret_rate = row.ret_type === 'servicio' ? 0.04 : 0.025;
    const calc_ret_money = calc_venta_price * calc_ret_rate;
    const calc_net_recibir = calc_venta_price - calc_ret_money;

    return {
      base: raw_base,
      iva: calc_iva,
      costCompra: calc_cost_compra,
      gainMoney: calc_gain_money,
      gainPercent: calc_gain_percent,
      ventaPrice: calc_venta_price,
      retRate: calc_ret_rate,
      retMoney: calc_ret_money,
      netoRecibir: calc_net_recibir
    };
  };

  const totals = useMemo(() => {
    return rows.reduce((acc, row) => {
      const d = processRow(row);
      return {
        base: acc.base + d.base,
        iva: acc.iva + d.iva,
        costCompra: acc.costCompra + d.costCompra,
        gain: acc.gain + d.gainMoney,
        retention: acc.retention + d.retMoney,
        neto: acc.neto + d.netoRecibir,
        venta: acc.venta + d.ventaPrice
      };
    }, { base: 0, iva: 0, costCompra: 0, gain: 0, retention: 0, neto: 0, venta: 0 });
  }, [rows]);

  const downloadPDF = async () => {
    const element = reportRef.current;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('Calculo-Rentabilidad.pdf');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-12 antialiased">
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-100/50 via-transparent to-blue-100/30"></div>

      <div className="max-w-[1700px] mx-auto space-y-12" id="report-area" ref={reportRef}>
        {/* Header */}
        <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 py-4 no-print">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-100">
              <Calculator size={14} /> Facturación v3.0
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-950 leading-[0.9]">
              Sistema de <span className="text-indigo-600">Calculo Fiscal</span>
            </h1>
          </div>

          <button
            onClick={addRow}
            className="flex items-center justify-center gap-4 bg-slate-950 text-white px-12 py-6 rounded-[2.5rem] font-black text-xl shadow-2xl hover:bg-indigo-600 hover:-translate-y-1 transition-all active:scale-95 self-start xl:self-center"
          >
            <Plus size={28} />
            <span>Añadir Partida</span>
          </button>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          {/* Main List */}
          <div className="xl:col-span-8 space-y-10">
            {rows.map((row, idx) => {
              const res = processRow(row);
              return (
                <div key={row.id} className="bg-white rounded-[3rem] shadow-xl shadow-slate-200 border border-slate-100 p-8 md:p-12 relative group transition-all hover:ring-8 hover:ring-indigo-50">
                  <button
                    onClick={() => removeRow(row.id)}
                    className="absolute top-8 right-8 text-slate-200 hover:text-rose-500 p-2 z-20"
                  >
                    <Trash2 size={24} />
                  </button>

                  <div className="space-y-12">
                    {/* Part 1: Costs */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest">
                        <ShoppingBag size={18} /> 1. Costo Inicial de Compra
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Base (Neto)</label>
                          <div className="relative">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-black text-2xl">$</span>
                            <input
                              type="number"
                              value={row.base_input || ''}
                              onChange={(e) => updateRow(row.id, 'base_input', e.target.value)}
                              className="w-full pl-12 pr-6 py-6 bg-slate-50 border-4 border-transparent rounded-[2rem] focus:bg-white focus:border-indigo-600 text-3xl font-black transition-all"
                              placeholder="0"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Costo Total + IVA 19%</label>
                          <div className="w-full px-8 py-6 bg-indigo-50 border-4 border-indigo-100 rounded-[2rem] flex justify-between items-center">
                            <span className="text-indigo-400 font-black text-xl">$</span>
                            <span className="text-3xl font-black text-indigo-700">{formatCurrency(res.costCompra)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Part 2: Growth & Tax */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest">
                          <TrendingUp size={18} /> 2. Margen de Venta
                        </div>
                        <div className="space-y-4">
                          <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] gap-1.5">
                            <button
                              onClick={() => updateRow(row.id, 'gain_type', 'percent')}
                              className={`flex-1 py-3 rounded-xl font-bold transition-all ${row.gain_type === 'percent' ? 'bg-white shadow-md text-emerald-600' : 'text-slate-400'}`}
                            >
                              % PORCENTAJE
                            </button>
                            <button
                              onClick={() => updateRow(row.id, 'gain_type', 'fixed')}
                              className={`flex-1 py-3 rounded-xl font-bold transition-all ${row.gain_type === 'fixed' ? 'bg-white shadow-md text-emerald-600' : 'text-slate-400'}`}
                            >
                              $ MONTO FIJO
                            </button>
                          </div>
                          <div className="relative">
                            <input
                              type="number"
                              value={row.gain_input || ''}
                              onChange={(e) => updateRow(row.id, 'gain_input', e.target.value)}
                              className="w-full px-8 py-6 bg-slate-50 border-4 border-transparent rounded-[2rem] focus:bg-white focus:border-emerald-500 text-2xl font-black transition-all"
                              placeholder="0"
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-xl font-black text-xs border border-emerald-200">
                              {row.gain_type === 'percent' ? `+$ ${formatCurrency(res.gainMoney)}` : `+ ${formatPercent(res.gainPercent)}`}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest">
                          <Target size={18} /> 3. Retención Fiscal
                        </div>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-[1.5rem]">
                            <button
                              onClick={() => updateRow(row.id, 'ret_type', 'venta')}
                              className={`py-3 rounded-xl font-bold transition-all ${row.ret_type === 'venta' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400'}`}
                            >
                              VENTAS (2.5%)
                            </button>
                            <button
                              onClick={() => updateRow(row.id, 'ret_type', 'servicio')}
                              className={`py-3 rounded-xl font-bold transition-all ${row.ret_type === 'servicio' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400'}`}
                            >
                              SERVICIOS (4%)
                            </button>
                          </div>

                          {/* THE BLACK BOX OF RESULTS */}
                          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-4 shadow-2xl">
                            <div className="flex justify-between items-center text-slate-400 font-bold text-sm">
                              <span>PRECIO DE VENTA (SUBTOTAL)</span>
                              <span className="font-black">{formatCurrency(res.ventaPrice)}</span>
                            </div>
                            <div className="flex justify-between items-center text-rose-400 font-black text-lg border-b border-white/5 pb-2">
                              <span>RETENCIÓN ({formatPercent(res.retRate)})</span>
                              <span>- {formatCurrency(res.retMoney)}</span>
                            </div>
                            <div className="flex justify-between items-end pt-2">
                              <span className="text-[10px] font-black tracking-widest text-indigo-400">NETO REAL RECIBIR</span>
                              <span className="text-4xl font-black">{formatCurrency(res.netoRecibir)}</span>
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

          {/* Sidebar */}
          <div className="xl:col-span-4 no-print">
            <div className="sticky top-10 space-y-8">
              <div className="bg-indigo-700 rounded-[3rem] p-10 md:p-14 text-white shadow-2xl shadow-indigo-200 border border-white/10 overflow-hidden relative">
                <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                <h2 className="text-2xl font-black mb-10 flex items-center gap-4">
                  <Receipt size={24} /> Resumen General
                </h2>

                <div className="space-y-8">
                  <div className="space-y-4 border-b border-indigo-500 pb-6 text-indigo-100 uppercase text-[10px] font-black tracking-[0.2em]">
                    <div className="flex justify-between items-center">
                      <span>Suma Base Neta</span>
                      <span className="text-xl font-bold text-white">{formatCurrency(totals.base)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Total IVA 19%</span>
                      <span className="text-xl font-bold text-white">{formatCurrency(totals.iva)}</span>
                    </div>
                  </div>

                  <div className="bg-indigo-800 p-8 rounded-[2rem] border border-white/5 shadow-inner">
                    <p className="text-[10px] font-black tracking-widest text-indigo-300 mb-1 uppercase">Costo Total Compra</p>
                    <p className="text-4xl font-black leading-none">{formatCurrency(totals.costCompra)}</p>
                  </div>

                  <div className="grid gap-4 px-2">
                    <div className="flex justify-between items-center text-emerald-300 font-black">
                      <span className="text-xs tracking-widest">UTILIDAD TOTAL</span>
                      <span className="text-2xl">+{formatCurrency(totals.gain)}</span>
                    </div>
                    <div className="flex justify-between items-center text-rose-300 font-black">
                      <span className="text-xs tracking-widest">TOTAL RETENCIONES</span>
                      <span className="text-2xl">-{formatCurrency(totals.retention)}</span>
                    </div>
                  </div>

                  <div className="pt-10 border-t-8 border-indigo-400 flex flex-col items-center text-center">
                    <p className="text-xs font-black tracking-[0.5em] opacity-60 mb-3">RECIBIR EN TOTAL</p>
                    <p className="text-[5.5rem] font-black tracking-tighter leading-none">{formatCurrency(totals.neto)}</p>
                  </div>

                  <button
                    onClick={downloadPDF}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white mt-12 py-7 rounded-[2rem] font-black text-xl transition-all flex items-center justify-center gap-4 shadow-xl group"
                  >
                    <Download size={24} className="group-hover:-translate-y-1 transition-transform" />
                    Descargar PDF
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm flex gap-4 items-start">
                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><Info size={24} /></div>
                <p className="text-slate-500 text-sm font-bold leading-relaxed">
                  Todos los valores están expresados en pesos colombianos (COP). La retención se calcula basándose en el precio final después de aplicar IVA y utilidad.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; padding: 0 !important; }
          #report-area { max-width: 100% !important; margin: 0 !important; }
          .shadow-xl, .shadow-2xl { box-shadow: none !important; border: 1px solid #eee !important; }
        }
      `}</style>
    </div>
  );
}
