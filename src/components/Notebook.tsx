/**
 * دفتر الباحث (كما في v5): لكل مختبر «توقعاتي / ملاحظاتي / استنتاجاتي».
 * التجارب تكتب فيه تلقائياً، والطالب يستطيع التعديل والإضافة.
 */
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useDialog } from '../utils/useDialog';
import type { NotebookPage } from '../utils/studentStore';
import { LAB_NAMES, type LabId } from '../content/tasks';

const TABS: LabId[] = ['at', 'ca', 'su', 'si'];
const FIELDS: { k: keyof NotebookPage; label: string }[] = [
  { k: 'p', label: 'توقعاتي' },
  { k: 'o', label: 'ملاحظاتي' },
  { k: 'c', label: 'استنتاجاتي' },
];

export const NotebookModal: React.FC<{
  notebook: Record<string, NotebookPage>;
  initialLab?: LabId;
  studentName: string;
  onChange: (lab: LabId, page: NotebookPage) => void;
  onClose: () => void;
}> = ({ notebook, initialLab = 'at', studentName, onChange, onClose }) => {
  const { dialogProps, titleId } = useDialog(onClose);
  const [lab, setLab] = useState<LabId>(initialLab);
  const page = notebook[lab] || { p: '', o: '', c: '' };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-950/75 backdrop-blur-md">
      <div {...dialogProps} className="modal-panel focus:outline-none relative w-full max-w-2xl bg-slate-900 border hairline rounded-t-[28px] sm:rounded-3xl p-5 sm:p-7 max-h-[94svh] sm:max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 id={titleId} className="font-display text-2xl text-white">دفتر الباحث</h2>
            <p className="text-xs text-slate-500 mt-0.5">{studentName}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق دفتر الباحث" className="w-9 h-9 rounded-full border hairline flex items-center justify-center text-slate-400">
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div role="tablist" aria-label="المختبرات" className="flex gap-1.5 overflow-x-auto mb-4">
          {TABS.map(t => (
            <button key={t} type="button" role="tab" aria-selected={lab === t} onClick={() => setLab(t)}
              className={`h-9 px-4 rounded-full border text-sm whitespace-nowrap ${lab === t ? 'border-amber-400 bg-amber-500/15 text-amber-200' : 'border-slate-700 text-slate-400'}`}>
              {LAB_NAMES[t]}
            </button>
          ))}
        </div>

        <div role="tabpanel" className="space-y-4">
          {FIELDS.map(f => (
            <label key={f.k} className="block">
              <span className="font-display text-amber-300 text-[15px]">{f.label}</span>
              <textarea
                value={(page[f.k] || '').trim()}
                onChange={e => onChange(lab, { ...page, [f.k]: e.target.value })}
                rows={4}
                placeholder="تُكتب ملاحظاتك هنا تلقائياً أثناء التجارب، ويمكنك الإضافة عليها."
                className="mt-1.5 w-full rounded-2xl bg-slate-950 border border-slate-700 focus:border-amber-400 focus:outline-none p-3 text-[14px] leading-relaxed text-slate-100"
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
