// Function to logout user
const logout = () => {
  // Clear all user data when logging out
  clearPreviousUserData();
  
  localStorage.removeItem('user');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  setUser(null);
}; 