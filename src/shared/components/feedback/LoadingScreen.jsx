import Spinner from "@/shared/components/ui/Spinner";

export default function LoadingScreen({ message = "Cargando..." }) {
     return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 gap-4">
               <Spinner size="lg" />
               <p className="text-sm text-gray-500">{message}</p>
          </div>
     );
}
