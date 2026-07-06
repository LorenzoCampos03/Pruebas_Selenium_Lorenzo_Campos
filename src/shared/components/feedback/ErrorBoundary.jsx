import { Component } from "react";

export default class ErrorBoundary extends Component {
     constructor(props) {
          super(props);
          this.state = { hasError: false, error: null };
     }

     static getDerivedStateFromError(error) {
          return { hasError: true, error };
     }

     render() {
          if (this.state.hasError) {
               return (
                    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
                         <div className="text-center max-w-md">
                              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                   <span className="text-2xl">!</span>
                              </div>
                              <h2 className="text-xl font-bold text-gray-800 mb-2">Algo salió mal</h2>
                              <p className="text-gray-500 text-sm mb-6">
                                   Ha ocurrido un error inesperado. Intenta recargar la página.
                              </p>
                              <button
                                   onClick={() => window.location.reload()}
                                   className="px-6 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors cursor-pointer"
                              >
                                   Recargar página
                              </button>
                         </div>
                    </div>
               );
          }

          return this.props.children;
     }
}
