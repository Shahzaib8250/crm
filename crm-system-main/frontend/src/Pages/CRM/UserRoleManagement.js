import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CRM.css';
import { useNotification } from '../../utils/NotificationContext';

const UserRoleManagement = () => {
  const { addNotification } = useNotification();

  // ... existing code ...
  // Replace showAlert with addNotification in all relevant places
  // Remove alert state and showAlert function
  // ... existing code ...
};

export default UserRoleManagement; 