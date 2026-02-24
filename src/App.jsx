import React, { useState } from 'react';
import { Plus, Trash2, Calculator, Receipt, ArrowRight, Download } from 'lucide-react';

export default function App() {
  const [rows, setRows] = useState([
    { id: Date.now(), base: 0, tipo: 'Producto' }
  ]);

  const addRow = () => {
    setRows([...rows, { id: Date.now(), base: 0, tipo: 'Producto' }]);
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

  // Totales generales
  const totals = rows.reduce((acc, row) => {
    const baseVal = parseFloat(row.base) || 0;
    const isProduct = row.tipo === 'Producto';
    const ivaPercent = isProduct ? 0.19 : 0;
    const ivaVal = baseVal * ivaPercent;
    const retPercent = isProduct ? 0.024 : 0.04;
    const retVal = baseVal * retPercent;

    return {
      base: acc.base + baseVal,
      iva: acc.iva + ivaVal,
      retention: acc.retention + retVal,
      total: acc.total + (baseVal + ivaVal - retVal)
    };
  }, { base: 0, iva: 0, retention: 0, total: 0 });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-indigo-100 antialiased p-4 md:p-12 overflow-x-hidden">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px] opacity-60"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px] opacity-60"></div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
              <Calculator className="text-white w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Calculadora de Facturación
              </h1>
              <p className="text-slate-500 font-medium">Gestiona tus impuestos de forma profesional</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={addRow}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all duration-200 active:scale-95"
            >
              <Plus size={20} />
              <span>Añadir Fila</span>
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Table Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-700 delay-100">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">Valor Base</th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400">Tipo</th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400 text-center">IVA</th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Base + IVA</th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400 text-center">Ret.</th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Retención</th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Total</th>
                      <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-400 text-center w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {rows.map((row) => {
                      const isProduct = row.tipo === 'Producto';
                      const baseVal = parseFloat(row.base) || 0;
                      const ivaPercent = isProduct ? 0.19 : 0;
                      const ivaVal = baseVal * ivaPercent;
                      const baseMasIva = baseVal + ivaVal;
                      const retPercent = isProduct ? 0.024 : 0.04;
                      const retVal = baseVal * retPercent;
                      const total = baseMasIva - retVal;

                      return (
                        <tr key={row.id} className="group hover:bg-slate-50/50 transition-colors duration-200">
                          <td className="px-6 py-4">
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                              <input
                                type="number"
                                value={row.base || ''}
                                onChange={(e) => updateRow(row.id, 'base', e.target.value)}
                                className="w-full pl-7 pr-4 py-2 bg-transparent border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:ring-0 transition-all font-medium"
                                placeholder="0"
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={row.tipo}
                              onChange={(e) => updateRow(row.id, 'tipo', e.target.value)}
                              className="w-full p-2 bg-white border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:ring-0 transition-all font-medium appearance-none cursor-pointer"
                            >
                              <option value="Producto">Producto</option>
                              <option value="Servicio">Servicio</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                              {formatPercent(ivaPercent)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-slate-700">
                            {formatCurrency(baseMasIva)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                              {formatPercent(retPercent)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-rose-500">
                            - {formatCurrency(retVal)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="font-extrabold text-emerald-600 bg-emerald-50 rounded-xl px-4 py-2 inline-block">
                              {formatCurrency(total)}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => removeRow(row.id)}
                              className="text-slate-300 hover:text-rose-500 p-2 rounded-lg transition-all hover:bg-rose-50 opacity-0 group-hover:opacity-100"
                              title="Eliminar fila"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Totals Summary Card */}
          <div className="lg:col-span-1 space-y-6 animate-in fade-in slide-in-from-right-4 duration-700 delay-200">
            <div className="bg-white rounded-3xl shadow-xl shadow-indigo-100/50 border border-indigo-50 p-6 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-bl-full -z-0"></div>

              <h2 className="text-xl font-bold flex items-center gap-2 relative z-10">
                <Receipt className="text-indigo-600" size={24} />
                Resumen Total
              </h2>

              <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-center text-slate-500 font-medium">
                  <span>Subtotal Base</span>
                  <span className="text-slate-700">{formatCurrency(totals.base)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 font-medium">
                  <span>Total IVA (19%)</span>
                  <span className="text-slate-700">{formatCurrency(totals.iva)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 font-medium pb-4 border-b border-slate-100">
                  <span>Retenciones</span>
                  <span className="text-rose-500">-{formatCurrency(totals.retention)}</span>
                </div>
                <div className="pt-2">
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Total Neto</span>
                  <div className="text-4xl font-black text-indigo-600 tracking-tight mt-1">
                    {formatCurrency(totals.total)}
                  </div>
                </div>
              </div>

              <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all hover:gap-4 active:scale-95 group">
                Generar Factura
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="bg-indigo-600 rounded-3xl p-6 text-white overflow-hidden relative shadow-lg shadow-indigo-200">
              <Download className="absolute -bottom-6 -right-6 w-32 h-32 opacity-10" />
              <h3 className="font-bold text-lg mb-2">Acciones Rápidas</h3>
              <p className="text-indigo-100 text-sm mb-4">Exporta tus cálculos para compartirlos fácilmente.</p>
              <button className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white w-full py-2.5 rounded-xl font-bold text-sm transition-all">
                Exportar a PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
