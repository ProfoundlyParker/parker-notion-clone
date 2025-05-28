import { ReactNode } from "react"
import { useAuthSession } from "./AuthSessionContext";
import { Navigate } from "react-router-dom";

type PrivateProps = {
    children: ReactNode;
}

export const Private = ({ children }: PrivateProps) => {
    const { session, loading } = useAuthSession();
  
    if (loading) {
      return <>Authenticating...</>;
    }
  
    return session ? <>{children}</> : <Navigate to="/auth" replace />;
  };