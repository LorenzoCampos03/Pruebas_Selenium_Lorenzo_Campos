import { useState, useCallback } from "react";

let globalState = {
     sidebarCollapsed: false,
     theme: "light",
};

const listeners = new Set();

function notify() {
     listeners.forEach((fn) => fn({ ...globalState }));
}

export function useAppStore() {
     const [state, setState] = useState(globalState);

     const subscribe = useCallback(() => {
          const handler = (newState) => setState(newState);
          listeners.add(handler);
          return () => listeners.delete(handler);
     }, []);

     useState(() => {
          const unsub = subscribe();
          return () => unsub();
     });

     const toggleSidebar = useCallback(() => {
          globalState = { ...globalState, sidebarCollapsed: !globalState.sidebarCollapsed };
          notify();
     }, []);

     const setSidebarCollapsed = useCallback((collapsed) => {
          globalState = { ...globalState, sidebarCollapsed: collapsed };
          notify();
     }, []);

     return {
          sidebarCollapsed: state.sidebarCollapsed,
          theme: state.theme,
          toggleSidebar,
          setSidebarCollapsed,
     };
}
