async function testLive() {
  // 1. Log in to live API
  const loginRes = await fetch('https://digital-hub-og1a.onrender.com/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'testclient1@gmail.com', password: 'password123' })
  });
  
  const loginData = await loginRes.json();
  console.log("Login:", loginData);

  if (!loginData.token) {
    console.log("Failed to login");
    return;
  }

  // 2. Request report
  const reportRes = await fetch('https://digital-hub-og1a.onrender.com/api/reports/request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${loginData.token}`
    },
    body: JSON.stringify({ reportType: 'MONTHLY_PERFORMANCE' })
  });

  const reportData = await reportRes.json();
  console.log("Report Request:", reportData);
}

testLive();
