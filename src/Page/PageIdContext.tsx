import { createContext, useContext } from "react";

export const PageIdContext = createContext<string | null>(null);

export const usePageId = () => {
    const context = useContext(PageIdContext);
    if (context === null) {
        throw new Error("usePageId must be used within a PageIdProvider");
    }
    return context;
};
