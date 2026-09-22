import React from 'react';

/**
 * FormField Component
 * Reusable accessible form input with label, helper text, and error indicators.
 *
 * @param {string} labelName - Visible form label
 * @param {string} placeholder - Input placeholder
 * @param {string} [inputType] - 'text' | 'number' | 'date' | 'url' | 'email'
 * @param {boolean} [isTextArea] - If true, renders a textarea
 * @param {string|number} value - Controlled input value
 * @param {function} handleChange - Change handler callback
 * @param {string} [step] - Numeric step for precision
 * @param {string} [helperText] - Subtext explanation
 * @param {string} [error] - Error feedback message
 * @param {boolean} [required] - Required field marker
 * @param {number} [rows] - Textarea row count
 */
const FormField = ({
  labelName,
  placeholder,
  inputType = 'text',
  isTextArea = false,
  value,
  handleChange,
  step,
  helperText,
  error,
  required = false,
  rows = 4,
}) => {
  const inputId = labelName.toLowerCase().replace(/\s+/g, '-');

  const baseInputStyles =
    'w-full py-2.5 px-3.5 outline-none font-sans text-sm rounded-xl border transition-all duration-200 bg-white/90 dark:bg-black/40 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border-slate-200 dark:border-white/10 focus:border-emerald-400 dark:focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 backdrop-blur-md shadow-xs';

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {labelName && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between"
        >
          <span>
            {labelName} {required && <span className="text-rose-500">*</span>}
          </span>
          {helperText && (
            <span className="text-[11px] font-normal text-slate-400 lowercase">{helperText}</span>
          )}
        </label>
      )}

      {isTextArea ? (
        <textarea
          id={inputId}
          required={required}
          value={value}
          onChange={handleChange}
          rows={rows}
          placeholder={placeholder}
          className={`${baseInputStyles} resize-y min-h-[90px] ${
            error ? 'border-rose-500 focus:border-rose-500' : ''
          }`}
        />
      ) : (
        <input
          id={inputId}
          required={required}
          value={value}
          onChange={handleChange}
          type={inputType}
          step={step}
          placeholder={placeholder}
          className={`${baseInputStyles} ${
            inputType === 'number' ? 'font-mono tabular-nums' : ''
          } ${error ? 'border-rose-500 focus:border-rose-500' : ''}`}
        />
      )}

      {error && <span className="text-xs text-rose-500 font-medium">{error}</span>}
    </div>
  );
};

export default FormField;
