export default function FormSection({ title, description, children, className = "" }) {
     return (
          <div className={`bg-white rounded-xl border border-gray-100 p-6 ${className}`}>
               {(title || description) && (
                    <div className="mb-5">
                         {title && <h3 className="text-base font-semibold text-gray-800">{title}</h3>}
                         {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
                    </div>
               )}
               <div className="space-y-4">{children}</div>
          </div>
     );
}
