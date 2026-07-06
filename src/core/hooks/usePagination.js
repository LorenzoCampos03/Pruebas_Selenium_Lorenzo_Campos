import { useState, useCallback } from "react";

export function usePagination(initialPage = 0, initialSize = 10) {
     const [page, setPage] = useState(initialPage);
     const [size, setSize] = useState(initialSize);
     const [totalPages, setTotalPages] = useState(0);
     const [totalElements, setTotalElements] = useState(0);

     const nextPage = useCallback(() => {
          setPage((prev) => Math.min(prev + 1, totalPages - 1));
     }, [totalPages]);

     const prevPage = useCallback(() => {
          setPage((prev) => Math.max(prev - 1, 0));
     }, []);

     const goToPage = useCallback((p) => {
          setPage(p);
     }, []);

     const updateFromResponse = useCallback((response) => {
          if (response) {
               setTotalPages(response.totalPages || 0);
               setTotalElements(response.totalElements || 0);
          }
     }, []);

     return {
          page,
          size,
          totalPages,
          totalElements,
          setSize,
          nextPage,
          prevPage,
          goToPage,
          updateFromResponse,
     };
}
