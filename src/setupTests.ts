import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';


afterEach(() => {
  // Clean up the DOM after each test to prevent memory leaks
  cleanup();
});