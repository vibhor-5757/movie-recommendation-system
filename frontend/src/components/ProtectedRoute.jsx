import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
    const needsSetup = localStorage.getItem("needsSetup") === "true";

    if (!needsSetup) {
        return <Navigate to="/MainPage" replace />;
    }

    return children;
};

export default ProtectedRoute;
