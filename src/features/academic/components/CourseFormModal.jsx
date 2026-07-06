import { useState, useEffect } from "react";
import { X, BookOpen, Save, Loader2 } from "lucide-react";
import { courseService } from "../services/academicService";
import { AGE_LEVELS, AGE_LEVEL_LABELS, CURRICULAR_AREAS, CURRICULAR_AREA_LABELS } from "../models/academicModel";
import { useAuth } from "@/core/auth/AuthContext";

const COURSE_CATALOG = [
  { name: "Personal Social",      areaCurricular: CURRICULAR_AREAS.PERSONAL_SOCIAL },
  { name: "Educación Religiosa",  areaCurricular: CURRICULAR_AREAS.EDUCACION_RELIGIOSA },
  { name: "Educación Física",     areaCurricular: CURRICULAR_AREAS.PSICOMOTRIZ },
  { name: "Comunicación",         areaCurricular: CURRICULAR_AREAS.COMUNICACION },
  { name: "Arte y Cultura",       areaCurricular: CURRICULAR_AREAS.ARTE_Y_CULTURA },
  { name: "Matemática",           areaCurricular: CURRICULAR_AREAS.MATEMATICA },
  { name: "Ciencia y Tecnología", areaCurricular: CURRICULAR_AREAS.CIENCIA_Y_TECNOLOGIA },
];

const generateCode = (courseName, ageLevel) => {
  if (!courseName || !ageLevel) return "";
  const initials = courseName.split(" ").map((w) => w[0]).join("").toUpperCase();
  const age = ageLevel.replace(" años", "").trim();
  return `${initials}-${age}A`;
};

export default function CourseFormModal({ course, ageLevel, onClose }) {
  const { user } = useAuth();
  const isEditing = !!course;

  const [form, setForm] = useState({
    name:           "",
    code:           "",
    areaCurricular: "",
    ageLevel:       ageLevel || "",
    description:    "",
  });

  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});
  const [availableCourses, setAvailableCourses] = useState(COURSE_CATALOG);

  useEffect(() => {
    if (!isEditing && form.ageLevel && user?.institutionId) {
      loadAvailableCourses(form.ageLevel);
    }
  }, [form.ageLevel]);

  const loadAvailableCourses = async (age) => {
    try {
      const existing = await courseService.getActiveByInstitution(user.institutionId);
      const existingNames = existing
        .filter(c => c.ageLevel === age)
        .map(c => c.name.trim().toLowerCase());
      setAvailableCourses(COURSE_CATALOG.filter(c => !existingNames.includes(c.name.trim().toLowerCase())));
    } catch {
      setAvailableCourses(COURSE_CATALOG);
    }
  };

  useEffect(() => {
    if (course) {
      setForm({
        name:           course.name           ?? "",
        code:           course.code           ?? "",
        areaCurricular: course.areaCurricular ?? "",
        ageLevel:       course.ageLevel       ?? ageLevel ?? "",
        description:    course.description    ?? "",
      });
    }
  }, [course]);

  const handleNameChange = (selectedName) => {
    const catalog = COURSE_CATALOG.find((c) => c.name === selectedName);
    const area    = catalog?.areaCurricular ?? "";
    const code    = generateCode(selectedName, form.ageLevel);
    setForm((prev) => ({ ...prev, name: selectedName, areaCurricular: area, code }));
    setErrors((prev) => ({ ...prev, name: undefined, areaCurricular: undefined }));
  };

  const handleAgeLevelChange = (selectedAge) => {
    const code = generateCode(form.name, selectedAge);
    setForm((prev) => ({ ...prev, ageLevel: selectedAge, code, name: "", areaCurricular: "" }));
    setErrors((prev) => ({ ...prev, ageLevel: undefined }));
    if (selectedAge && user?.institutionId) loadAvailableCourses(selectedAge);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.name)     e.name     = "Selecciona un curso";
    if (!form.ageLevel) e.ageLevel = "Selecciona un nivel de edad";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    try {
      setLoading(true);
      const payload = { ...form, institutionId: user.institutionId };
      if (isEditing) {
        await courseService.update(course.id, payload);
      } else {
        await courseService.create(payload);
      }
      onClose(true);
    } catch (err) {
      console.error("Error al guardar curso:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col border border-gray-200">

        {}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-5 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold">
                {isEditing ? "Editar curso" : "Nuevo curso"}
              </h2>
            </div>
            <button
              onClick={() => onClose(false)}
              className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {}
        <div className="p-5 space-y-4 bg-white overflow-y-auto">

          {}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <select
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? "border-red-400" : "border-gray-300"
              }`}
            >
              <option value="">Selecciona un curso</option>
              {availableCourses.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Área curricular
              <span className="ml-2 text-xs text-gray-400">(se completa automáticamente)</span>
            </label>
            <input
              readOnly
              value={form.areaCurricular ? CURRICULAR_AREA_LABELS[form.areaCurricular] ?? form.areaCurricular : ""}
              placeholder="Se completará al elegir el curso"
              className="w-full border border-gray-200 bg-gray-50 text-gray-500 rounded-lg px-3 py-2 text-sm cursor-not-allowed"
            />
          </div>

          {}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nivel de edad <span className="text-red-500">*</span>
            </label>
            <select
              value={form.ageLevel}
              onChange={(e) => handleAgeLevelChange(e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.ageLevel ? "border-red-400" : "border-gray-300"
              }`}
            >
              <option value="">Selecciona un nivel</option>
              {Object.values(AGE_LEVELS).map((level) => (
                <option key={level} value={level}>{AGE_LEVEL_LABELS[level]}</option>
              ))}
            </select>
            {errors.ageLevel && <p className="text-red-500 text-xs mt-1">{errors.ageLevel}</p>}
          </div>

          {}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código
              <span className="ml-2 text-xs text-gray-400">(generado automáticamente)</span>
            </label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => handleChange("code", e.target.value.toUpperCase())}
              placeholder="Ej: PS-3A"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
              <span className="ml-2 text-xs text-gray-400">(opcional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Describe brevemente el curso..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
            />
          </div>
        </div>

        {}
        <div className="px-5 pb-5 flex items-center justify-end gap-3 bg-white rounded-b-2xl">
          <button
            onClick={() => onClose(false)}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEditing ? "Guardar cambios" : "Crear curso"}
          </button>
        </div>
      </div>
    </div>
  );
}