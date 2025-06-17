import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../common/Header/Header';
import styles from './DatabaseQuery.module.css';

const DatabaseQuery = () => {
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    
    if (!userId.trim()) {
      setError('Please enter a User ID');
      return;
    }

    const userIdNum = parseInt(userId);
    if (isNaN(userIdNum)) {
      setError('Please enter a valid numeric User ID');
      return;
    }

    // Navigate to user details page
    navigate(`/user-details/${userIdNum}`);
  };

  return (
    <div className="database-query-page">
      <Header />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Database Query - User Details</h1>
          <p>Search for user details and downloaded reports by User ID</p>
        </div>

        <div className={styles.searchForm}>
          <form onSubmit={handleSearch}>
            <div className={styles.inputGroup}>
              <label htmlFor="userId">User ID:</label>
              <input
                type="number"
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter User ID (e.g., 1, 2, 3...)"
                className={styles.input}
              />
            </div>
            
            {error && (
              <div className={styles.error}>
                {error}
              </div>
            )}
            
            <button type="submit" className={styles.searchButton} disabled={loading}>
              {loading ? 'Searching...' : 'Search User'}
            </button>
          </form>
        </div>

        <div className={styles.instructions}>
          <h3>How to use:</h3>
          <ol>
            <li>Enter a User ID in the input field above</li>
            <li>Click "Search User" to view user details</li>
            <li>The system will show:
              <ul>
                <li>User information (ID, username, email, name, join date)</li>
                <li>All downloaded tax reports for that user</li>
                <li>Document details (name, size, download date)</li>
                <li>Option to download stored documents</li>
              </ul>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default DatabaseQuery; 