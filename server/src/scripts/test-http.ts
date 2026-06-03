import http from 'http';

const loginData = JSON.stringify({
  email: 'admin@enterprise.com',
  password: 'admin123'
});

const makeRequest = (options: http.RequestOptions, postData?: string): Promise<{ status?: number, headers: http.IncomingHttpHeaders, body: string }> => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body
        });
      });
    });

    req.on('error', (e) => reject(e));

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
};

const run = async () => {
  try {
    console.log('Logging in as admin@enterprise.com...');
    const loginRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    }, loginData);

    console.log('Login response status:', loginRes.status);
    const loginBody = JSON.parse(loginRes.body);
    const token = loginBody.token;
    console.log('JWT Token retrieved:', token ? 'YES' : 'NO');

    if (!token) {
      console.log('Login failed:', loginRes.body);
      return;
    }

    console.log('\nFetching /api/customers as Admin...');
    const customersRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/customers',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('Customers status:', customersRes.status);
    console.log('Customers response headers:', customersRes.headers);
    const customersBody = JSON.parse(customersRes.body);
    console.log('Customers pagination total:', customersBody.pagination?.total);
    console.log('Customers array length:', customersBody.customers?.length);

    console.log('\nFetching /api/users as Admin...');
    const usersRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/users',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('Users status:', usersRes.status);
    const usersBody = JSON.parse(usersRes.body);
    console.log('Users list length:', usersBody.length);

  } catch (err) {
    console.error('HTTP test error:', err);
  }
};

run();
