import fetch from 'node-fetch';

async function testLogin() {
  try {
    const response = await fetch('https://the-trek.onrender.com/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'Admin',
        password: 'AdminPass123!'
      })
    });
    
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ Login successful!');
      console.log('User:', data.user);
      console.log('Is Admin:', data.user.is_admin);
    } else {
      console.log('\n❌ Login failed');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testLogin();
