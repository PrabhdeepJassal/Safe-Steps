// Network Test Utility
// Add this to test network connectivity

export const testNetworkConnection = async () => {
  try {
    const response = await fetch('http://192.168.29.111:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emailPhone: 'test@test.com',
        password: 'wrongpass'
      }),
    });
    
    const data = await response.json();
    console.log('Network test result:', data);
    
    if (data.success === false && data.message === 'Invalid credentials') {
      console.log('✅ Network connection working! Backend is reachable.');
      return true;
    } else {
      console.log('❌ Unexpected response from backend');
      return false;
    }
  } catch (error) {
    console.log('❌ Network test failed:', error.message);
    return false;
  }
};

// Usage: Call this function from your component to test
// testNetworkConnection();
