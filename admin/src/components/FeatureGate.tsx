import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Organization } from '../types';

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
}

const FeatureGate = ({ feature, children }: FeatureGateProps) => {
  const { user } = useAuth();
  const org = user?.organization as Organization | undefined;
  const enabledFeatures = org?.enabledFeatures;

  // If no features set (legacy orgs), allow everything
  if (!enabledFeatures || enabledFeatures.length === 0) {
    return <>{children}</>;
  }

  if (!enabledFeatures.includes(feature)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default FeatureGate;
