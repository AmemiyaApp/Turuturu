// Test file to verify @vercel/analytics/react import
import { Analytics } from '@vercel/analytics/react';

// This should not cause any TypeScript errors if the import is working
const TestComponent = () => {
  return Analytics({ mode: 'development' });
};

export default TestComponent;