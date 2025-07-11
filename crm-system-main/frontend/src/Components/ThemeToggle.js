import React from 'react';
import { useTheme } from '../utils/ThemeContext';
import './ThemeToggle.css';

/**
 * ThemeToggle Component - Provides a button to switch between light and dark themes
 * 
 * @returns {JSX.Element} Theme toggle button
 */
const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className="theme-toggle-wrapper">
      <button 
        onClick={toggleTheme} 
        className="theme-toggle-btn"
        title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      >
        <span role="img" aria-label="theme-logo" style={{ marginRight: 6 }}>🌓</span>
        {theme === 'light' ? (
          <i className="fas fa-moon"></i>
        ) : (
          <i className="fas fa-sun" style={{ color: '#f39c12' }}></i>
        )}
      </button>
    </div>
  );
};

export default ThemeToggle; 