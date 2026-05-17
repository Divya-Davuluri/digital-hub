import {
  createAutomation,
  getAutomations,
  updateAutomation,
  toggleAutomation,
  deleteAutomation,
  getAutomationStats
} from '../controllers/dmAutomationController';

// Simple mock for Express Request/Response
function createMockResponse(onEnd: (status: number, data: any) => void) {
  const res: any = {
    statusCode: 200,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      onEnd(this.statusCode, data);
      return this;
    }
  };
  return res;
}

async function runTests() {
  console.log('=== STARTING INSTAGRAM AUTOMATION API TESTS ===');

  const mockUser = { tenantId: 'test-tenant-id' };

  // 1. Test getAutomationStats (empty DB, should return demo data)
  console.log('\n--- 1. Testing GET /api/instagram/stats (Demo State) ---');
  await new Promise<void>((resolve) => {
    const req = { user: mockUser } as any;
    const res = createMockResponse((status, data) => {
      console.log(`Status: ${status}`);
      console.log('Data:', JSON.stringify(data, null, 2));
      if (status === 200 && data.success && data.source === 'demo') {
        console.log('✅ getAutomationStats Demo Test Passed');
      } else {
        console.log('❌ getAutomationStats Demo Test Failed');
      }
      resolve();
    });
    getAutomationStats(req, res, () => {});
  });

  // 2. Test getAutomations (empty DB, should return demo fallback)
  console.log('\n--- 2. Testing GET /api/instagram/automations (Demo State) ---');
  await new Promise<void>((resolve) => {
    const req = { user: mockUser } as any;
    const res = createMockResponse((status, data) => {
      console.log(`Status: ${status}`);
      console.log('Number of Automations:', data.data?.length);
      if (status === 200 && data.success && data.source === 'demo' && data.data?.length === 4) {
        console.log('✅ getAutomations Demo Test Passed');
      } else {
        console.log('❌ getAutomations Demo Test Failed');
      }
      resolve();
    });
    getAutomations(req, res, () => {});
  });

  // 3. Test createAutomation (Inserting new automation into DB)
  console.log('\n--- 3. Testing POST /api/instagram/automations ---');
  let createdId = '';
  await new Promise<void>((resolve) => {
    const req = {
      user: mockUser,
      body: {
        name: 'Test Instagram Automation 1',
        type: 'comment_to_dm',
        triggerKeyword: 'TEST',
        triggerCondition: 'contains',
        replyMessage: 'This is a test reply message!',
        followUpMessages: [
          { day: 1, message: 'Follow up 1' }
        ],
        dailyLimit: 150
      }
    } as any;
    const res = createMockResponse((status, data) => {
      console.log(`Status: ${status}`);
      console.log('Data:', JSON.stringify(data, null, 2));
      if (status === 201 && data.success && data.data?.id) {
        createdId = data.data.id;
        console.log('✅ createAutomation Test Passed');
      } else {
        console.log('❌ createAutomation Test Failed');
      }
      resolve();
    });
    createAutomation(req, res, () => {});
  });

  if (!createdId) {
    console.error('Could not proceed with update/toggle/delete tests as create failed.');
    process.exit(1);
  }

  // 4. Test getAutomations again (should now return custom data, source != demo)
  console.log('\n--- 4. Testing GET /api/instagram/automations (Custom State) ---');
  await new Promise<void>((resolve) => {
    const req = { user: mockUser } as any;
    const res = createMockResponse((status, data) => {
      console.log(`Status: ${status}`);
      console.log('Source:', data.source || 'db');
      console.log('Number of Automations:', data.data?.length);
      if (status === 200 && data.success && data.source !== 'demo' && data.data?.length >= 1) {
        console.log('✅ getAutomations Custom Test Passed');
      } else {
        console.log('❌ getAutomations Custom Test Failed');
      }
      resolve();
    });
    getAutomations(req, res, () => {});
  });

  // 5. Test updateAutomation
  console.log('\n--- 5. Testing PUT /api/instagram/automations/:id ---');
  await new Promise<void>((resolve) => {
    const req = {
      user: mockUser,
      params: { id: createdId },
      body: {
        name: 'Updated Test Instagram Automation Name',
        dailyLimit: 250
      }
    } as any;
    const res = createMockResponse((status, data) => {
      console.log(`Status: ${status}`);
      console.log('Data:', JSON.stringify(data, null, 2));
      if (status === 200 && data.success && data.data?.name === 'Updated Test Instagram Automation Name' && data.data?.dailyLimit === 250) {
        console.log('✅ updateAutomation Test Passed');
      } else {
        console.log('❌ updateAutomation Test Failed');
      }
      resolve();
    });
    updateAutomation(req, res, () => {});
  });

  // 6. Test toggleAutomation
  console.log('\n--- 6. Testing POST /api/instagram/automations/:id/toggle ---');
  await new Promise<void>((resolve) => {
    const req = {
      user: mockUser,
      params: { id: createdId }
    } as any;
    const res = createMockResponse((status, data) => {
      console.log(`Status: ${status}`);
      console.log('Data:', JSON.stringify(data, null, 2));
      if (status === 200 && data.success && data.isActive === false) {
        console.log('✅ toggleAutomation Test Passed');
      } else {
        console.log('❌ toggleAutomation Test Failed');
      }
      resolve();
    });
    toggleAutomation(req, res, () => {});
  });

  // 7. Test deleteAutomation
  console.log('\n--- 7. Testing DELETE /api/instagram/automations/:id ---');
  await new Promise<void>((resolve) => {
    const req = {
      user: mockUser,
      params: { id: createdId }
    } as any;
    const res = createMockResponse((status, data) => {
      console.log(`Status: ${status}`);
      console.log('Data:', JSON.stringify(data, null, 2));
      if (status === 200 && data.success) {
        console.log('✅ deleteAutomation Test Passed');
      } else {
        console.log('❌ deleteAutomation Test Failed');
      }
      resolve();
    });
    deleteAutomation(req, res, () => {});
  });

  // 8. Test getAutomations again (should be back to demo state because DB is empty)
  console.log('\n--- 8. Testing GET /api/instagram/automations (Should return Demo because empty) ---');
  await new Promise<void>((resolve) => {
    const req = { user: mockUser } as any;
    const res = createMockResponse((status, data) => {
      console.log(`Status: ${status}`);
      console.log('Source:', data.source);
      if (status === 200 && data.success && data.source === 'demo') {
        console.log('✅ getAutomations Cleanup Verification Passed');
      } else {
        console.log('❌ getAutomations Cleanup Verification Failed');
      }
      resolve();
    });
    getAutomations(req, res, () => {});
  });

  console.log('\n=== ALL INSTAGRAM AUTOMATION API TESTS COMPLETED ===');
  process.exit(0);
}

runTests();
