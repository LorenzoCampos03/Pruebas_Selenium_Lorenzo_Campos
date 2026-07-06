import { useState, useEffect, useCallback } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  IdCard,
  Lock,
  Eye,
  EyeOff,
  Camera,
  Save,
  KeyRound,
} from "lucide-react";
import { Card, Button, PhotoUploadModal } from "@/shared/components/ui";
import { alertApiError, alertUpdated } from "@/shared/components/feedback";
import { useAuth } from "@/core/auth/AuthContext";
import { userService } from "@/features/users/services/userService";
import { authService } from "@/core/auth/authService";
import { ROLE_LABELS } from "@/core/utils/constants";
import toast from "react-hot-toast";

// ─────────────────────── helpers ──────────────────────────────────────────────

function FormField({ label, icon: Icon, error, children }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        )}
        {children}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function TextInput({ icon, error, ...props }) {
  return (
    <FormField icon={icon} error={error}>
      <input
        {...props}
        className={[
          "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-800",
          "placeholder:text-gray-400 outline-none transition-colors",
          "focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500",
          icon ? "pl-9" : "",
          error ? "border-red-400" : "border-gray-300",
        ].join(" ")}
      />
    </FormField>
  );
}

function PasswordInput({ label, error, showPassword, onToggle, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          {...props}
          type={showPassword ? "text" : "password"}
          className={[
            "w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-800",
            "placeholder:text-gray-400 outline-none transition-colors pl-9 pr-10",
            "focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500",
            error ? "border-red-400" : "border-gray-300",
          ].join(" ")}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─────────────────────── componente principal ──────────────────────────────────

export default function ProfilePage() {
  const { user, updateProfile, logout } = useAuth();

  // ── datos personales ──
  const [personalData, setPersonalData] = useState({
    firstName: "",
    lastName: "",
    motherLastName: "",
    documentType: "",
    documentNumber: "",
    phone: "",
    email: "",
    address: "",
  });
  const [personalErrors, setPersonalErrors] = useState({});
  const [savingPersonal, setSavingPersonal] = useState(false);

  // ── foto ──
  const [photoModal, setPhotoModal] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(null);

  // ── contraseña ──
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [savingPassword, setSavingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    newPass: false,
    confirm: false,
  });

  // ── cargar datos del usuario ──
  const loadUserData = useCallback(async () => {
    if (!user?.userId) return;
    try {
      const response = await userService.getById(user.userId);
      const data = response?.data ?? response;
      setPersonalData({
        firstName: data.firstName || data.first_name || "",
        lastName: data.lastName || data.last_name || "",
        motherLastName: data.motherLastName || data.mother_last_name || "",
        documentType: data.documentType || data.document_type || "",
        documentNumber: data.documentNumber || data.document_number || "",
        phone: data.phone || "",
        email: data.email || "",
        address: data.address || "",
      });
      if (data.photoUrl || data.photo_url) {
        const url = data.photoUrl || data.photo_url;
        const ts = localStorage.getItem(`photo_timestamp_${user.userId}`);
        setPhotoUrl(ts ? `${url}?t=${ts}` : url);
      }
    } catch (err) {
      alertApiError(err);
    }
  }, [user?.userId]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // ── guardar datos personales ──
  // ── validador en tiempo real de campos individuales ──
  const validateField = (name, value, allData = personalData) => {
    setPersonalErrors((prev) => {
      const errs = { ...prev };
      
      if (name === "firstName") {
        if (!value.trim()) {
          errs.firstName = "El nombre es requerido";
        } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(value)) {
          errs.firstName = "El nombre solo debe contener letras (no se permiten números ni símbolos)";
        } else {
          delete errs.firstName;
        }
      }

      if (name === "lastName") {
        if (!value.trim()) {
          errs.lastName = "El apellido paterno es requerido";
        } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(value)) {
          errs.lastName = "El apellido paterno solo debe contener letras (no se permiten números ni símbolos)";
        } else {
          delete errs.lastName;
        }
      }

      if (name === "motherLastName") {
        if (value.trim() && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(value)) {
          errs.motherLastName = "El apellido materno solo debe contener letras (no se permiten números ni símbolos)";
        } else {
          delete errs.motherLastName;
        }
      }

      if (name === "phone") {
        if (value.trim()) {
          if (!/^\d+$/.test(value)) {
            errs.phone = "El celular solo debe contener números (no se permiten letras ni símbolos)";
          } else if (!value.startsWith("9")) {
            errs.phone = "El celular debe iniciar obligatoriamente con el número 9";
          } else if (value.length !== 9) {
            errs.phone = `El celular debe tener exactamente 9 dígitos (ingresados: ${value.length}/9)`;
          } else {
            delete errs.phone;
          }
        } else {
          delete errs.phone;
        }
      }

      if (name === "documentNumber") {
        const docType = allData.documentType;
        if (docType?.toUpperCase() === 'DNI') {
          if (!value) {
            errs.documentNumber = "El DNI es requerido";
          } else if (!/^\d+$/.test(value)) {
            errs.documentNumber = "El DNI solo debe contener números (no se permiten letras ni símbolos)";
          } else if (value.length !== 8) {
            errs.documentNumber = `El DNI debe tener exactamente 8 dígitos (ingresados: ${value.length}/8)`;
          } else {
            delete errs.documentNumber;
          }
        } else {
          delete errs.documentNumber;
        }
      }

      return errs;
    });
  };

  // ── guardar datos personales ──
  const validatePersonal = () => {
    const errs = {};
    
    if (!personalData.firstName.trim()) {
      errs.firstName = "El nombre es requerido";
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(personalData.firstName)) {
      errs.firstName = "El nombre solo debe contener letras (no se permiten números ni símbolos)";
    }

    if (!personalData.lastName.trim()) {
      errs.lastName = "El apellido paterno es requerido";
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(personalData.lastName)) {
      errs.lastName = "El apellido paterno solo debe contener letras (no se permiten números ni símbolos)";
    }

    if (personalData.motherLastName.trim() && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(personalData.motherLastName)) {
      errs.motherLastName = "El apellido materno solo debe contener letras (no se permiten números ni símbolos)";
    }

    if (personalData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalData.email)) {
      errs.email = "Correo electrónico inválido";
    }

    if (personalData.phone) {
      if (!/^\d+$/.test(personalData.phone)) {
        errs.phone = "El celular solo debe contener números (no se permiten letras ni símbolos)";
      } else if (!personalData.phone.startsWith("9")) {
        errs.phone = "El celular debe iniciar obligatoriamente con el número 9";
      } else if (personalData.phone.length !== 9) {
        errs.phone = `El celular debe tener exactamente 9 dígitos (ingresados: ${personalData.phone.length}/9)`;
      }
    }

    if (personalData.documentType?.toUpperCase() === 'DNI') {
      if (!personalData.documentNumber) {
        errs.documentNumber = "El DNI es requerido";
      } else if (!/^\d+$/.test(personalData.documentNumber)) {
        errs.documentNumber = "El DNI solo debe contener números (no se permiten letras ni símbolos)";
      } else if (personalData.documentNumber.length !== 8) {
        errs.documentNumber = `El DNI debe tener exactamente 8 dígitos (ingresados: ${personalData.documentNumber.length}/8)`;
      }
    }

    setPersonalErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSavePersonal = async () => {
    if (!validatePersonal()) return;
    setSavingPersonal(true);
    try {
      await userService.update(user.userId, {
        firstName: personalData.firstName,
        lastName: personalData.lastName,
        motherLastName: personalData.motherLastName,
        documentType: personalData.documentType,
        documentNumber: personalData.documentNumber,
        phone: personalData.phone,
        email: personalData.email,
        address: personalData.address,
      });
      updateProfile({
        firstName: personalData.firstName,
        lastName: personalData.lastName,
        email: personalData.email,
        documentNumber: personalData.documentNumber,
      });
      await alertUpdated("Perfil actualizado correctamente");
    } catch (err) {
      alertApiError(err);
    } finally {
      setSavingPersonal(false);
    }
  };

  // ── subir foto ──
  const handleUploadPhoto = async (file) => {
    const response = await userService.uploadPhoto(user.userId, file);
    const newUrl = response?.data?.photoUrl || response?.data?.photo_url;
    if (newUrl) {
      const ts = new Date().getTime();
      localStorage.setItem(`photo_timestamp_${user.userId}`, ts);
      setPhotoUrl(`${newUrl}?t=${ts}`);
      window.dispatchEvent(new CustomEvent('photo-updated', { detail: { url: newUrl, ts } }));
    }
    toast.success("Foto de perfil actualizada");
  };

  // ── cambiar contraseña ──
  const validatePassword = () => {
    const errs = {};
    if (!passwords.currentPassword) errs.currentPassword = "Ingrese su contraseña actual";
    if (!passwords.newPassword) errs.newPassword = "Ingrese la nueva contraseña";
    else if (passwords.newPassword.length < 8)
      errs.newPassword = "La contraseña debe tener al menos 8 caracteres";
    if (!passwords.confirmPassword) errs.confirmPassword = "Confirme la nueva contraseña";
    else if (passwords.newPassword !== passwords.confirmPassword)
      errs.confirmPassword = "Las contraseñas no coinciden";
    setPasswordErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) return;
    setSavingPassword(true);
    try {
      await authService.changePassword(
        user.username,
        passwords.currentPassword,
        passwords.newPassword
      );
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordErrors({});
      await alertUpdated("Contraseña actualizada correctamente. Deberá iniciar sesión nuevamente.");
      logout();
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        setPasswordErrors({ currentPassword: "Contraseña actual incorrecta" });
      } else {
        alertApiError(err);
      }
    } finally {
      setSavingPassword(false);
    }
  };

  const roleLabel = ROLE_LABELS[user?.role] || user?.role || "Usuario";
  const displayName = [personalData.firstName, personalData.lastName].filter(Boolean).join(" ") || user?.username;
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() || "")
    .join("");

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Encabezado de perfil */}
      <Card className="overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-100 px-6 py-5 flex items-center gap-5">
          <div className="relative shrink-0">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={displayName}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-primary-600 flex items-center justify-center text-white text-2xl font-bold shadow">
                {initials || <User className="w-8 h-8" />}
              </div>
            )}
            <button
              onClick={() => setPhotoModal(true)}
              className="absolute -bottom-1.5 -right-1.5 w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-600 hover:text-primary-600 hover:border-primary-300 transition-colors shadow-sm cursor-pointer"
              title="Cambiar foto"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{displayName}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{user?.email || personalData.email}</p>
            <span className="mt-1.5 inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-100">
              {roleLabel}
            </span>
          </div>
        </div>
      </Card>

      {/* Datos personales */}
      <Card>
        <Card.Header>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-primary-600" />
            </div>
            <div>
              <Card.Title>Datos personales</Card.Title>
              <p className="text-xs text-gray-400 mt-0.5">Actualiza tu información personal</p>
            </div>
          </div>
        </Card.Header>

        <Card.Content>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextInput
              label="Nombre(s)"
              icon={User}
              placeholder="Ingrese nombre"
              value={personalData.firstName}
              onChange={(e) => {
                const val = e.target.value;
                setPersonalData((p) => ({ ...p, firstName: val }));
                validateField("firstName", val);
              }}
              error={personalErrors.firstName}
            />
            <TextInput
              label="Apellido paterno"
              icon={User}
              placeholder="Apellido paterno"
              value={personalData.lastName}
              onChange={(e) => {
                const val = e.target.value;
                setPersonalData((p) => ({ ...p, lastName: val }));
                validateField("lastName", val);
              }}
              error={personalErrors.lastName}
            />
            <TextInput
              label="Apellido materno"
              icon={User}
              placeholder="Apellido materno"
              value={personalData.motherLastName}
              onChange={(e) => {
                const val = e.target.value;
                setPersonalData((p) => ({ ...p, motherLastName: val }));
                validateField("motherLastName", val);
              }}
              error={personalErrors.motherLastName}
            />
            <TextInput
              label="Correo electrónico"
              icon={Mail}
              type="email"
              placeholder="correo@ejemplo.com"
              value={personalData.email}
              onChange={(e) => setPersonalData((p) => ({ ...p, email: e.target.value }))}
              error={personalErrors.email}
            />
            <TextInput
              label="Teléfono"
              icon={Phone}
              placeholder="Número de celular"
              value={personalData.phone}
              maxLength={9}
              onChange={(e) => {
                let val = e.target.value;
                if (val.replace(/\D/g, '').startsWith('519') && val.replace(/\D/g, '').length > 9) {
                  val = val.replace(/\D/g, '').slice(2);
                }
                setPersonalData((p) => ({ ...p, phone: val }));
                validateField("phone", val);
              }}
              error={personalErrors.phone}
            />
            <div className="grid grid-cols-2 gap-3">
              <TextInput
                label="Tipo de documento"
                icon={IdCard}
                placeholder="DNI / CE"
                value={personalData.documentType}
                onChange={(e) => {
                  const type = e.target.value;
                  setPersonalData((p) => {
                    const next = { ...p, documentType: type };
                    validateField("documentNumber", next.documentNumber, next);
                    return next;
                  });
                }}
              />
              <TextInput
                label="N° de documento"
                placeholder="Número"
                value={personalData.documentNumber}
                maxLength={personalData.documentType?.toUpperCase() === 'DNI' ? 8 : undefined}
                onChange={(e) => {
                  const val = e.target.value;
                  setPersonalData((p) => ({ ...p, documentNumber: val }));
                  validateField("documentNumber", val);
                }}
                error={personalErrors.documentNumber}
              />
            </div>
            <div className="sm:col-span-2">
              <TextInput
                label="Dirección"
                icon={MapPin}
                placeholder="Ingrese su dirección"
                value={personalData.address}
                onChange={(e) => setPersonalData((p) => ({ ...p, address: e.target.value }))}
              />
            </div>
          </div>
        </Card.Content>

        <Card.Footer>
          <div className="flex justify-end">
            <Button
              onClick={handleSavePersonal}
              loading={savingPersonal}
              icon={Save}
            >
              Guardar cambios
            </Button>
          </div>
        </Card.Footer>
      </Card>

      {/* Cambiar contraseña */}
      <Card>
        <Card.Header>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
              <KeyRound className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <Card.Title>Cambiar contraseña</Card.Title>
              <p className="text-xs text-gray-400 mt-0.5">Usa una contraseña segura de al menos 8 caracteres</p>
            </div>
          </div>
        </Card.Header>

        <Card.Content>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            <div className="sm:col-span-2">
              <PasswordInput
                label="Contraseña actual"
                placeholder="Ingrese su contraseña actual"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
                error={passwordErrors.currentPassword}
                showPassword={showPasswords.current}
                onToggle={() => setShowPasswords((s) => ({ ...s, current: !s.current }))}
              />
            </div>
            <PasswordInput
              label="Nueva contraseña"
              placeholder="Mínimo 8 caracteres"
              value={passwords.newPassword}
              onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
              error={passwordErrors.newPassword}
              showPassword={showPasswords.newPass}
              onToggle={() => setShowPasswords((s) => ({ ...s, newPass: !s.newPass }))}
            />
            <PasswordInput
              label="Confirmar nueva contraseña"
              placeholder="Repita la nueva contraseña"
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))}
              error={passwordErrors.confirmPassword}
              showPassword={showPasswords.confirm}
              onToggle={() => setShowPasswords((s) => ({ ...s, confirm: !s.confirm }))}
            />
          </div>
        </Card.Content>

        <Card.Footer>
          <div className="flex justify-end">
            <Button
              onClick={handleChangePassword}
              loading={savingPassword}
              icon={Lock}
              variant="secondary"
            >
              Cambiar contraseña
            </Button>
          </div>
        </Card.Footer>
      </Card>

      {/* Modal de foto */}
      <PhotoUploadModal
        isOpen={photoModal}
        onClose={() => setPhotoModal(false)}
        onUpload={handleUploadPhoto}
        title="Foto de perfil"
        currentPhotoUrl={photoUrl}
      />
    </div>
  );
}
