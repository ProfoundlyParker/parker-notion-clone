import { useEffect, useRef, useState } from "react"

export const useOverflowsScreenBottom = () => {
    const ref = useRef<HTMLDivElement>(null);
    const [ overflows, setOverflows ] = useState(false);

    const checkOverflow = () => {
        if (ref.current) {
            const { bottom } = ref.current.getBoundingClientRect();
            const { innerHeight } = window;
            setOverflows(bottom > innerHeight);
        }
    };

    useEffect(() => {
        checkOverflow();
    }, []);

    return { overflows, ref, checkOverflow };
}