import { useState, useEffect, useRef } from "react";
import { Plus, Calendar } from "lucide-react";
import { useAuth } from "@/core/auth/AuthContext";
import { useAcademicPeriods } from "../hooks/useAcademicPeriods";
import { AcademicPeriodList } from "../components/academic-periods/AcademicPeriodList";
import { AcademicPeriodForm } from "../components/academic-periods/AcademicPeriodForm";
import { institutionService } from "@/features/institutions/services/institutionService";
import { extractData, isSuccessResponse } from "@/core/api/apiResponse";
import Modal from "@/shared/components/ui/Modal";
import Button from "@/shared/components/ui/Button";
import { formatAcademicPeriodForApi, formatAcademicPeriodUpdateForApi } from "../models/academicPeriodModel";

/**
 * Página de gestión de períodos académicos - Con componentes compartidos
 */
export default function AcademicPeriodsPage() {
  const { user } = useAuth();
  const {
    periods,
    loading,
    fetchByInstitution,
    createPeriod,
    updatePeriod,
    deletePeriod,
    activatePeriod,
    closePeriod,
  } = useAcademicPeriods();

  const [showModal, setShowModal] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [institution, setInstitution] = useState({});
  const [loadingInstitution, setLoadingInstitution] = useState(true);
  const hasFetched = useRef(false);

  // Cargar institución
  useEffect(() => {
    const loadInstitution = async () => {
      if (!user?.institutionId) {
        setLoadingInstitution(false);
        return;
      }

      try {
        const response = await institutionService.getById(user.institutionId);
        const data = isSuccessResponse(response) ? extractData(response) : response;
        setInstitution(data || {});
      } catch (error) {
        console.error("Error al cargar institución:", error);
        setInstitution({});
      } finally {
        setLoadingInstitution(false);
      }
    };

    loadInstitution();
  }, [user]);

  useEffect(() => {
    if (!hasFetched.current && user?.institutionId) {
      hasFetched.current = true;
      fetchByInstitution(user.institutionId);
    }
  }, [fetchByInstitution, user?.institutionId]);

  const handleCreate = () => {
    setEditingPeriod(null);
    setShowModal(true);
  };

  const handleEdit = (period) => {
    setEditingPeriod(period);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPeriod(null);
  };

  const handleSubmit = async (periodData) => {
    setIsSubmitting(true);
    try {
      if (editingPeriod) {
        const payload = formatAcademicPeriodUpdateForApi(periodData);
        await updatePeriod(editingPeriod.id, payload);
      } else {
        const payload = formatAcademicPeriodForApi(periodData);
        await createPeriod(payload);
      }
      handleCloseModal();
      // Recargar solo los periodos de la institución del usuario
      if (user?.institutionId) {
        fetchByInstitution(user.institutionId);
      }
    } catch (error) {
      console.error("Error al guardar período:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await deletePeriod(id);
    if (result && user?.institutionId) {
      fetchByInstitution(user.institutionId);
    }
  };

  const handleActivate = async (id) => {
    try {
      await activatePeriod(id);
      if (user?.institutionId) {
        fetchByInstitution(user.institutionId);
      }
    } catch (error) {
      console.error("Error al activar período:", error);
    }
  };

  const handleClose = async (id) => {
    try {
      await closePeriod(id);
      if (user?.institutionId) {
        fetchByInstitution(user.institutionId);
      }
    } catch (error) {
      console.error("Error al cerrar período:", error);
    }
  };

  const activePeriods = periods.filter(p => p.status === 'ACTIVE').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header minimalista con componentes compartidos */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-900 rounded-lg">
                <Calendar className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Períodos Académicos</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {periods.length} {periods.length === 1 ? 'período' : 'períodos'} · {activePeriods} {activePeriods === 1 ? 'activo' : 'activos'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Botón de nuevo período */}
              <Button
                variant="primary"
                size="md"
                icon={Plus}
                onClick={handleCreate}
              >
                Nuevo Período
              </Button>
            </div>
          </div>
        </div>

        {/* Lista de períodos */}
        <AcademicPeriodList
          periods={periods}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onActivate={handleActivate}
          onClose={handleClose}
          isLoading={loading}
          institution={institution}
        />

        {/* Modal de formulario con componente compartido */}
        <Modal
          isOpen={showModal}
          onClose={handleCloseModal}
          title={editingPeriod ? "Editar Período Académico" : "Nuevo Período Académico"}
          size="lg"
        >
          <AcademicPeriodForm
            period={editingPeriod}
            onSubmit={handleSubmit}
            onCancel={handleCloseModal}
            isLoading={isSubmitting}
          />
        </Modal>
      </div>
    </div>
  );
}
