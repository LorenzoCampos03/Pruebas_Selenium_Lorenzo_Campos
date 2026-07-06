import { FileText, CheckCircle, XCircle, Clock } from "lucide-react";

function Card({ children, padding = "p-4" }) {
     return <div className={`bg-white rounded-lg shadow ${padding}`}>{children}</div>;
}

export default function StatsCards({ evaluations }) {
     const total = evaluations.length;
     const active = evaluations.filter(e => e.status === "ACTIVE").length;
     const inactive = evaluations.filter(e => e.status === "INACTIVE").length;
     const followUp = evaluations.filter(e => e.requiresFollowUp).length;

     const stats = [
          { label: "Total", value: total, icon: FileText, bgColor: "bg-blue-100", iconColor: "text-blue-600" },
          { label: "Activas", value: active, icon: CheckCircle, bgColor: "bg-green-100", iconColor: "text-green-600" },
          { label: "Inactivas", value: inactive, icon: XCircle, bgColor: "bg-red-100", iconColor: "text-red-600" },
          { label: "Seguimiento", value: followUp, icon: Clock, bgColor: "bg-orange-100", iconColor: "text-orange-600" },
     ];

     return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
               {stats.map((stat) => (
                    <Card key={stat.label} padding="p-4">
                         <div className="flex items-center justify-between">
                              <div>
                                   <p className="text-sm text-gray-600">{stat.label}</p>
                                   <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                              </div>
                              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                                   <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                              </div>
                         </div>
                    </Card>
               ))}
          </div>
     );
}
