import React, { useState, useMemo, useRef } from 'react';
import {
  Plus,
  Trash2,
  Calculator,
  Receipt,
  Percent,
  DollarSign,
  Briefcase,
  ShoppingBag,
  TrendingUp,
  Target,
  Info,
  Download,
  AlertCircle,
  FileText
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function App() {
  // Estado inicial robusto
  const [rows, setRows] = useState([
    {
      id: Date.now(),
      valorBaseStr: "0",
      tipoMargen: "monto", // "porcentaje" o "monto"
      valorMargenStr: "0",
      tipoRetencion: "venta" // "venta" (2.5%) o "servicio" (4%)
    }
  ]);

  const [isExporting, setIsExporting] = useState(false);
  const pdfContentRef = useRef();

  const handleAddRow = () => {
    setRows(prev => [...prev, {
      id: Date.now() + Math.random(),
      valorBaseStr: "0",
      tipoMargen: "monto",
      valorMargenStr: "0",
      tipoRetencion: "venta"
    }]);
  };

  const handleRemoveRow = (id) => {
    if (rows.length > 1) {
      setRows(prev => prev.filter(r => r.id !== id));
    }
  };

  const updateRow = (id, updates) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  // Functión de formateo segura
  const currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  const formatCOP = (val) => currencyFormatter.format(Math.round(val || 0));
  const formatPct = (dec) => `${(dec * 100).toFixed(2)}%`;

  // Motor de cálculo unificado
  const calculatedRows = useMemo(() => {
    return rows.map(row => {
      const base = parseFloat(row.valorBaseStr) || 0;
      const iva = base * 0.19;
      const subtotalConIva = base + iva;

      let gananciaDinero = 0;
      let gananciaPorcentaje = 0;

      if (row.tipoMargen === 'porcentaje') {
        gananciaPorcentaje = (parseFloat(row.valorMargenStr) || 0) / 100;
        gananciaDinero = subtotalConIva * gananciaPorcentaje;
      } else {
        gananciaDinero = parseFloat(row.valorMargenStr) || 0;
        gananciaPorcentaje = subtotalConIva > 0 ? gananciaDinero / subtotalConIva : 0;
      }

      const valorVentaTotal = subtotalConIva + gananciaDinero;
      const tasaRet = row.tipoRetencion === 'servicio' ? 0.04 : 0.025;
      const retencionDinero = valorVentaTotal * tasaRet;
      const netoFinal = valorVentaTotal - retencionDinero;

      return {
        ...row,
        calc: {
          base,
          iva,
          subtotalConIva,
          gananciaDinero,
          gananciaPorcentaje,
          valorVentaTotal,
          tasaRet,
          retencionDinero,
          netoFinal
        }
      };
    });
  }, [rows]);

  // Consolidado total basado en las filas ya calculadas
  const totalGeneral = useMemo(() => {
    return calculatedRows.reduce((acc, row) => ({
      base: acc.base + row.calc.base,
      iva: acc.iva + row.calc.iva,
      compraTotal: acc.compraTotal + row.calc.subtotalConIva,
      ganancia: acc.ganancia + row.calc.gananciaDinero,
      retencion: acc.retencion + row.calc.retencionDinero,
      neto: acc.neto + row.calc.netoFinal,
      venta: acc.venta + row.calc.valorVentaTotal
    }), { base: 0, iva: 0, compraTotal: 0, ganancia: 0, retencion: 0, neto: 0, venta: 0 });
  }, [calculatedRows]);

  const handleDownloadPDF = async () => {
    try {
      setIsExporting(true);
      const element = pdfContentRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#f8fafc'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Calculo_Impuestos_${new Date().toLocaleDateString()}.pdf`);
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      alert("Hubo un error al generar el PDF. Por favor intenta de nuevo.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 p-4 md:p-8 xl:p-12">
      <div className="max-w-[1600px] mx-auto space-y-12" ref={pdfContentRef}>

        {/* Header (No se oculta en PDF para que el reporte tenga título) */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-4 border-b border-slate-200">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em]">
              <Calculator size={14} /> Inteligencia Tributaria
            </div>
            <h1 className="text-5xl lg:text-7xl font-black tracking-tighter text-slate-950 leading-tight">
              Reporte de <span className="text-indigo-600">Costos y Venta</span>
            </h1>
          </div>

          <button
            onClick={handleAddRow}
            className="group flex items-center justify-center gap-4 bg-slate-950 text-white px-10 py-5 rounded-3xl font-black text-xl shadow-2xl hover:bg-indigo-600 transition-all active:scale-95 no-print"
          >
            <Plus size={24} className="group-hover:rotate-90 transition-transform" />
            <span>Nueva Partida</span>
          </button>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">

          {/* Listado de Partidas */}
          <div className="xl:col-span-8 space-y-8">
            {calculatedRows.map((row, index) => (
              <div key={row.id} className="bg-white rounded-[3rem] shadow-xl border border-slate-100 p-8 md:p-12 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[4rem] group-hover:bg-indigo-50/30 transition-colors"></div>

                <button
                  onClick={() => handleRemoveRow(row.id)}
                  className="absolute top-8 right-8 text-slate-200 hover:text-rose-500 p-3 rounded-2xl hover:bg-rose-50 transition-all no-print"
                >
                  <Trash2 size={24} />
                </button>

                <div className="space-y-10 relative z-10">
                  {/* Bloque 1: Costo Compra */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest">
                        <ShoppingBag size={18} /> 1. Costo Base de Adquisición
                      </div>
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black text-2xl">$</span>
                        <input
                          type="number"
                          value={row.valorBaseStr || ''}
                          onChange={(e) => updateRow(row.id, { valorBaseStr: e.target.value })}
                          className="w-full pl-12 pr-6 py-6 bg-slate-50 border-4 border-transparent rounded-[2rem] focus:bg-white focus:border-indigo-600 text-3xl font-black no-print"
                          placeholder="0"
                        />
                        <div className="hidden print:block text-3xl font-black py-6 px-12 bg-slate-50 rounded-[2rem]">
                          {formatCOP(row.calc.base)}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-4">Costo Neto (Base + IVA 19%)</label>
                      <div className="w-full px-10 py-6 bg-indigo-50 border-4 border-indigo-100 rounded-[2rem] flex justify-between items-center shadow-inner">
                        <span className="text-indigo-600 font-black text-xl">$</span>
                        <span className="text-3xl font-black text-indigo-800">{formatCOP(row.calc.subtotalConIva)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100"></div>

                  {/* Bloque 2 y 3: Ganancia y Retención */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Ganancia */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest">
                        <TrendingUp size={18} /> 2. Margen de Venta Proyectado
                      </div>
                      <div className="space-y-4">
                        <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] gap-1.5 no-print">
                          <button
                            onClick={() => updateRow(row.id, { tipoMargen: 'porcentaje' })}
                            className={`flex-1 py-3 rounded-xl font-bold transition-all ${row.tipoMargen === 'porcentaje' ? 'bg-white shadow-md text-emerald-600' : 'text-slate-400'}`}
                          >
                            % PORCENTAJE
                          </button>
                          <button
                            onClick={() => updateRow(row.id, { tipoMargen: 'monto' })}
                            className={`flex-1 py-3 rounded-xl font-bold transition-all ${row.tipoMargen === 'monto' ? 'bg-white shadow-md text-emerald-600' : 'text-slate-400'}`}
                          >
                            $ MONTO FIJO
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            value={row.valorMargenStr || ''}
                            onChange={(e) => updateRow(row.id, { valorMargenStr: e.target.value })}
                            className="w-full px-8 py-6 bg-slate-50 border-4 border-transparent rounded-[2rem] focus:bg-white focus:border-emerald-500 text-2xl font-black no-print"
                            placeholder="0"
                          />
                          <div className="hidden print:block text-2xl font-black py-6 px-8 bg-slate-50 rounded-[2rem]">
                            {row.tipoMargen === 'porcentaje' ? `${row.valorMargenStr}%` : formatCOP(row.valorMargenStr)}
                          </div>
                          <div className="absolute right-6 top-1/2 -translate-y-1/2 bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-xl font-black text-[10px] border border-emerald-200 uppercase tracking-wider">
                            {row.tipoMargen === 'porcentaje' ? `+ ${formatCOP(row.calc.gananciaDinero)}` : `+ ${formatPct(row.calc.gananciaPorcentaje)}`}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Retención */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest">
                        <Target size={18} /> 3. Retención en la Fuente
                      </div>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-[1.5rem] no-print">
                          <button
                            onClick={() => updateRow(row.id, { tipoRetencion: 'venta' })}
                            className={`py-3 rounded-xl font-bold transition-all ${row.tipoRetencion === 'venta' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400'}`}
                          >
                            VENTAS (2.5%)
                          </button>
                          <button
                            onClick={() => updateRow(row.id, { tipoRetencion: 'servicio' })}
                            className={`py-3 rounded-xl font-bold transition-all ${row.tipoRetencion === 'servicio' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400'}`}
                          >
                            SERVICIOS (4%)
                          </button>
                        </div>

                        {/* RESULTADO FINAL DE FILA */}
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-4 shadow-2xl border-l-8 border-indigo-500">
                          <div className="flex justify-between items-center text-slate-400 font-bold text-[10px] tracking-[0.2em]">
                            <span>PRECIO DE VENTA SUGERIDO</span>
                            <span className="text-white font-black">{formatCOP(row.calc.valorVentaTotal)}</span>
                          </div>
                          <div className="flex justify-between items-center text-rose-400 font-black text-lg">
                            <span>RETENCIÓN ({formatPct(row.calc.tasaRet)})</span>
                            <span className="bg-rose-950/40 px-3 py-1 rounded-xl">-{formatCOP(row.calc.retencionDinero)}</span>
                          </div>
                          <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                            <span className="text-[10px] font-black tracking-[0.3em] text-indigo-400 uppercase">Neto Real a Recibir</span>
                            <span className="text-4xl font-black text-white">{formatCOP(row.calc.netoFinal)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Barra Lateral de Consolidado */}
          <div className="xl:col-span-4 no-print">
            <div className="sticky top-10 space-y-8">
              <div className="bg-indigo-700 rounded-[3.5rem] p-10 md:p-14 text-white shadow-2xl shadow-indigo-200 border border-white/10 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

                <h2 className="text-3xl font-black mb-12 flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-2xl shadow-inner"><Receipt size={28} /></div>
                  Resumen Consolidado
                </h2>

                <div className="space-y-8">
                  <div className="space-y-5 border-b border-indigo-500 pb-8 text-indigo-100 uppercase text-[10px] font-black tracking-[0.2em]">
                    <div className="flex justify-between items-center">
                      <span>Total Base Neta</span>
                      <span className="text-2xl font-black text-white">{formatCOP(totalGeneral.base)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Total IVA 19%</span>
                      <span className="text-2xl font-black text-white">{formatCOP(totalGeneral.iva)}</span>
                    </div>
                  </div>

                  <div className="bg-indigo-800/80 p-8 rounded-[2.5rem] border border-white/5 shadow-inner">
                    <p className="text-[10px] font-black tracking-[0.3em] text-indigo-300 mb-2 uppercase">Gasto Total de Compra</p>
                    <p className="text-5xl font-black leading-none">{formatCOP(totalGeneral.compraTotal)}</p>
                  </div>

                  <div className="grid gap-6 px-4">
                    <div className="flex justify-between items-center text-emerald-300 font-black">
                      <span className="text-xs uppercase tracking-widest">UTILIDAD TOTAL</span>
                      <span className="text-3xl">+{formatCOP(totalGeneral.ganancia)}</span>
                    </div>
                    <div className="flex justify-between items-center text-rose-300 font-black">
                      <span className="text-xs uppercase tracking-widest">TOTAL RETENCIONES</span>
                      <span className="text-3xl">-{formatCOP(totalGeneral.retencion)}</span>
                    </div>
                  </div>

                  <div className="pt-12 mt-6 border-t-8 border-indigo-500 flex flex-col items-center text-center">
                    <p className="text-xs font-black tracking-[0.6em] opacity-60 mb-4 uppercase">Resultado Neto Total</p>
                    <p className="text-[6rem] lg:text-[7rem] font-black tracking-tighter leading-none drop-shadow-xl">
                      {formatCOP(totalGeneral.neto)}
                    </p>
                  </div>

                  <button
                    onClick={handleDownloadPDF}
                    disabled={isExporting}
                    className={`w-full bg-slate-950 hover:bg-slate-900 text-white mt-12 py-7 rounded-[2.5rem] font-black text-2xl transition-all flex items-center justify-center gap-5 shadow-2xl group ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isExporting ? (
                      <TrendingUp className="animate-spin" size={28} />
                    ) : (
                      <>
                        <Download size={28} className="group-hover:translate-y-1 transition-transform" />
                        <span>Descargar Reporte</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Tips / Info */}
              <div className="bg-white rounded-[2.5rem] p-10 border-4 border-slate-200/50 flex flex-col gap-6">
                <div className="flex items-center gap-4 text-indigo-600">
                  <div className="p-3 bg-indigo-50 rounded-2xl"><Info size={24} /></div>
                  <h4 className="font-black text-slate-950 uppercase tracking-[0.2em] text-sm md:text-base">Guía del reporte</h4>
                </div>
                <p className="text-slate-500 text-lg leading-relaxed font-semibold">
                  Este sistema calcula la rentabilidad basándose en el <span className="text-slate-900 border-b-2 border-indigo-200">Precio Sugerido de Venta</span>, restando automáticamente las retenciones de ley vigentes en Colombia (Venta 2.5% o Servicios 4%).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0 !important; padding: 10mm !important; }
          .shadow-xl, .shadow-2xl { box-shadow: none !important; border: 1px solid #e2e8f0 !important; }
          .rounded-[3rem], .rounded-[3.5rem], .rounded-[2.5rem] { border-radius: 1rem !important; }
          input { border: none !important; background: transparent !important; }
        }
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
}
