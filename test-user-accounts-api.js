async function testUserAccountsAPI() {
  try {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch('http://localhost:3000/api/user/accounts');
    const data = await response.json();
    
    console.log('User accounts API response:');
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testUserAccountsAPI();
