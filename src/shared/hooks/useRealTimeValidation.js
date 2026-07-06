import { useState, useCallback, useRef, useEffect } from "react";

export function useRealTimeValidation(validateFn, delay = 500) {
    const [error, setError] = useState(null);
    const [isValidating, setIsValidating] = useState(false);
    const timeoutRef = useRef(null);

    const validate = useCallback((value) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        
        setError(null);
        if (!value || value.trim() === "") {
            setIsValidating(false);
            return;
        }

        setIsValidating(true);
        timeoutRef.current = setTimeout(async () => {
            try {
                const response = await validateFn(value);
                if (response && response.data === true) {
                    setError(response.message || "El dato ya existe");
                } else {
                    setError(null);
                }
            } catch (err) {
                console.error("Error validando campo:", err);
            } finally {
                setIsValidating(false);
            }
        }, delay);
    }, [validateFn, delay]);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return { error, setError, isValidating, validate };
}
