import { X, BookOpen } from "lucide-react";
import CompetencyTreeView from "./CompetencyTreeView";

export default function CourseDetailModal({ course, onClose }) {
     return (
          <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
               <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col border border-gray-200">

                    {}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-5">
                         <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                   <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <BookOpen className="w-5 h-5 text-white" />
                                   </div>
                                   <div>
                                        <h2 className="text-lg font-bold leading-tight">{course.name}</h2>
                                        <p className="text-blue-100 text-xs mt-0.5">
                                             {course.code} · {course.areaCurricular} · {course.ageLevel}
                                        </p>
                                   </div>
                              </div>
                              <button
                                   onClick={onClose}
                                   className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors flex-shrink-0"
                              >
                                   <X className="w-5 h-5" />
                              </button>
                         </div>
                    </div>

                    {}
                    <div className="flex-1 overflow-y-auto p-5 bg-gray-50">
                         <CompetencyTreeView course={course} />
                    </div>
               </div>
          </div>
     );
}