import fetch from 'node-fetch';

async function testRateLimit() {
  const url = 'http://localhost:3000/api/auth/login';
  const testData = {
    email: "test@example.com",
    password: "testpassword"
  };

  console.log('Starting rate limit test...');
  console.log('Making 10 rapid requests to test rate limiting (limit is 5 requests per minute)...');

  const requests = Array(10).fill().map(async (_, i) => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });

      const data = await response.json();
      console.log(`Request ${i + 1}: Status ${response.status}${response.status === 429 ? ' (Rate Limited!)' : ''}`);
      
      if (response.status === 429) {
        console.log('Rate limit response:', data);
      }
    } catch (error) {
      console.error(`Request ${i + 1} failed:`, error.message);
    }
  });

  await Promise.all(requests);
  console.log('Test completed!');
}

testRateLimit();
