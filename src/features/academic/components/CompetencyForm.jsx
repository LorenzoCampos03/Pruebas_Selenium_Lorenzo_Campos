import { useState, useEffect } from "react";
import { Layers, Save, Loader2 } from "lucide-react";
import { competencyService } from "../services/academicService";

// Catálogo de competencias por curso según MINEDU Ciclo II
const COMPETENCY_CATALOG = {
  "Personal Social": [
    "Construye su identidad",
    "Convive y participa democráticamente en la búsqueda del bien común",
    "Construye interpretaciones históricas",
    "Gestiona responsablemente el ambiente y el espacio",
    "Gestiona responsablemente los recursos económicos"
  ],
  "Educación Religiosa": [
    "Construye su identidad como persona humana, amada por Dios, digna, libre y trascendente",
    "Asume la experiencia del encuentro personal y comunitario con Dios en su proyecto de vida en coherencia con su creencia religiosa"
  ],
  "Educación Física": [
    "Se desenvuelve de manera autónoma a través de su motricidad",
    "Asume una vida saludable",
    "Interactúa a través de sus habilidades sociomotrices"
  ],
  "Comunicación": [
    "Se comunica oralmente en su lengua materna",
    "Lee diversos tipos de textos escritos en su lengua materna",
    "Escribe diversos tipos de textos en su lengua materna"
  ],
  "Arte y Cultura": [
    "Aprecia de manera crítica manifestaciones artístico-culturales",
    "Crea proyectos desde los lenguajes artísticos"
  ],
  "Matemática": [
    "Resuelve problemas de cantidad",
    "Resuelve problemas de regularidad, equivalencia y cambio",
    "Resuelve problemas de forma, movimiento y localización",
    "Resuelve problemas de gestión de datos e incertidumbre"
  ],
  "Ciencia y Tecnología": [
    "Indaga mediante métodos científicos para construir sus conocimientos",
    "Explica el mundo físico basándose en conocimientos sobre los seres vivos, materia y energía, biodiversidad, tierra y universo",
    "Diseña y construye soluciones tecnológicas para resolver problemas de su entorno"
  ],
  "Competencias Transversales": [
    "Se desenvuelve en los entornos virtuales generados por las TIC",
    "Gestiona su aprendizaje de manera autónoma"
  ]
};

// Generar código automático: COMP-001, COMP-002, etc.
const generateCompetencyCode = (orderIndex) => {
  const paddedNumber = String(orderIndex).padStart(3, '0');
  return `COMP-${paddedNumber}`;
};

export default function CompetencyForm({ competency, onSave, onCancel, saving, courseName }) {
     const [formData, setFormData] = useState(competency);
     const [availableCompetencies, setAvailableCompetencies] = useState([]);
     const [existingCompetencies, setExistingCompetencies] = useState([]);

     const isEditing = !!(formData.id && formData.id.trim() !== "");

     useEffect(() => {
          if (!isEditing && courseName && competency.courseId) {
               loadExistingCompetencies();
          }
     }, [courseName, competency.courseId]);

     const loadExistingCompetencies = async () => {
          try {
               const data = await competencyService.getByCourse(competency.courseId);
               const existing = Array.isArray(data) ? data : (data?.data || []);
               setExistingCompetencies(existing);
               
               // Filtrar competencias ya creadas
               const catalog = COMPETENCY_CATALOG[courseName] || [];
               const existingNames = existing.map(c => c.name.trim().toLowerCase());
               const available = catalog.filter(name => !existingNames.includes(name.trim().toLowerCase()));
               setAvailableCompetencies(available);
          } catch (err) {
               console.error("Error al cargar competencias existentes:", err);
               setAvailableCompetencies(COMPETENCY_CATALOG[courseName] || []);
          }
     };

     const handleCompetencyNameChange = (selectedName) => {
          if (!selectedName) return;
          
          // Calcular el siguiente orden
          const nextOrder = existingCompetencies.length + 1;
          const code = generateCompetencyCode(nextOrder);
          
          setFormData(prev => ({
               ...prev,
               name: selectedName,
               code: code,
               orderIndex: nextOrder,
               description: selectedName // Usar el nombre como descripción por defecto
          }));
     };

     const handleChange = (e) => {
          const { name, value } = e.target;
          setFormData(prev => ({
               ...prev,
               [name]: name === "orderIndex" ? parseInt(value) || 1 : value
          }));
     };

     const handleSubmit = (e) => {
          e.preventDefault();
          onSave(formData);
     };

     return (
          <form onSubmit={handleSubmit} className="space-y-5">

               {}
               <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                    <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
                         <Layers className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                         <h4 className="text-lg font-bold text-gray-900">
                              {isEditing ? "Editar Competencia" : "Nueva Competencia"}
                         </h4>
                         <p className="text-xs text-gray-400">Completa los campos requeridos</p>
                    </div>
               </div>

               {}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nombre - Desplegable con catálogo */}
                    <div className="md:col-span-2">
                         <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                              Nombre <span className="text-red-400">*</span>
                         </label>
                         {isEditing ? (
                              <input
                                   type="text"
                                   name="name"
                                   value={formData.name}
                                   onChange={handleChange}
                                   required
                                   placeholder="Nombre de la competencia"
                                   className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all"
                              />
                         ) : (
                              <select
                                   value={formData.name}
                                   onChange={(e) => handleCompetencyNameChange(e.target.value)}
                                   required
                                   className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all"
                              >
                                   <option value="">Selecciona una competencia</option>
                                   {availableCompetencies.map((name, idx) => (
                                        <option key={idx} value={name}>{name}</option>
                                   ))}
                              </select>
                         )}
                         {!isEditing && availableCompetencies.length === 0 && (
                              <p className="text-xs text-amber-600 mt-1">
                                   ⚠️ Todas las competencias de este curso ya han sido creadas
                              </p>
                         )}
                    </div>

                    {/* Código - Generado automáticamente */}
                    <div>
                         <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                              Código
                              <span className="ml-2 text-xs text-gray-400 normal-case font-normal">(automático)</span>
                         </label>
                         <input
                              type="text"
                              name="code"
                              value={formData.code}
                              onChange={handleChange}
                              readOnly={!isEditing}
                              placeholder="Ej: COMP-001"
                              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all ${
                                   isEditing ? 'border-gray-200 bg-white' : 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed'
                              }`}
                         />
                    </div>

                    {/* Orden - Generado automáticamente */}
                    <div>
                         <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                              Orden
                              <span className="ml-2 text-xs text-gray-400 normal-case font-normal">(automático)</span>
                         </label>
                         <input
                              type="number"
                              name="orderIndex"
                              value={formData.orderIndex}
                              onChange={handleChange}
                              min="1"
                              readOnly={!isEditing}
                              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all ${
                                   isEditing ? 'border-gray-200 bg-white' : 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed'
                              }`}
                         />
                    </div>

                    {/* Descripción */}
                    <div className="md:col-span-2">
                         <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                              Descripción
                              <span className="ml-2 text-xs text-gray-400 normal-case font-normal">(opcional)</span>
                         </label>
                         <textarea
                              name="description"
                              value={formData.description}
                              onChange={handleChange}
                              rows={3}
                              placeholder="Descripción adicional de la competencia..."
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all resize-none"
                         />
                    </div>
               </div>

               {}
               <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                         type="button"
                         onClick={onCancel}
                         disabled={saving}
                         className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                         Cancelar
                    </button>
                    <button
                         type="submit"
                         disabled={saving}
                         className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 active:scale-95 transition-all text-sm font-medium shadow-sm disabled:opacity-60"
                    >
                         {saving
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Save className="w-4 h-4" />}
                         {isEditing ? "Guardar cambios" : "Crear competencia"}
                    </button>
               </div>
          </form>
     );
}