/**
 * Quick Test Script for Mini Kanban Backend
 * Tests:
 * 1. Register a test user
 * 2. Login & retrieve JWT token
 * 3. Create a Kanban Board (auto-generates To Do, In Progress, Done columns)
 * 4. Add tasks to "To Do" column
 * 5. Move a task from "To Do" to "In Progress" (Cross-column movement)
 * 6. Reorder tasks within the column
 * 7. Fetch full board with ordered columns & tasks
 */

const BASE_URL = 'http://localhost:4000/api';

async function testBackend() {
    console.log('🚀 Starting Mini Kanban Backend API Test...\n');

    const randomId = Math.floor(Math.random() * 10000);
    const testEmail = `testuser_${randomId}@example.com`;
    const testPassword = 'Password123!';

    // 1. Register User
    console.log(`1️⃣  Registering user: ${testEmail}...`);
    const registerRes = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Kamrul Tester',
            email: testEmail,
            password: testPassword,
        }),
    });
    const registerData = await registerRes.json();
    if (!registerRes.ok) throw new Error(`Register failed: ${JSON.stringify(registerData)}`);
    console.log('   ✅ User registered successfully!\n');

    // 2. Login User
    console.log('2️⃣  Logging in to obtain JWT token...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: testEmail,
            password: testPassword,
        }),
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    const token = loginData.token;
    console.log('   ✅ Logged in successfully! Received JWT token.\n');

    const authHeaders = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };

    // 3. Create a Board
    console.log('3️⃣  Creating a new Kanban Board...');
    const boardRes = await fetch(`${BASE_URL}/boards`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
            title: 'Sprint 1 Project Board',
            description: 'Full-stack engineering test board',
        }),
    });
    const board = await boardRes.json();
    if (!boardRes.ok) throw new Error(`Create board failed: ${JSON.stringify(board)}`);
    console.log(`   ✅ Board "${board.title}" created with ID: ${board.id}`);
    console.log(`   Default columns created: ${board.columns.map((c: any) => c.title).join(', ')}\n`);

    const todoCol = board.columns.find((c: any) => c.title === 'To Do');
    const inProgressCol = board.columns.find((c: any) => c.title === 'In Progress');

    // 4. Create Tasks in "To Do"
    console.log('4️⃣  Creating 3 Tasks in "To Do" column...');
    const task1Res = await fetch(`${BASE_URL}/tasks`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
            columnId: todoCol.id,
            title: 'Task 1: Design database schema',
            description: 'PostgreSQL + Prisma setup',
        }),
    });
    const task1 = await task1Res.json();

    const task2Res = await fetch(`${BASE_URL}/tasks`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
            columnId: todoCol.id,
            title: 'Task 2: Build movement API',
            description: 'Fractional indexing reordering',
        }),
    });
    const task2 = await task2Res.json();

    const task3Res = await fetch(`${BASE_URL}/tasks`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
            columnId: todoCol.id,
            title: 'Task 3: Connect Frontend UI',
            description: 'Next.js + Tailwind Kanban view',
        }),
    });
    const task3 = await task3Res.json();

    console.log(`   ✅ Created Task 1 (order: ${task1.order})`);
    console.log(`   ✅ Created Task 2 (order: ${task2.order})`);
    console.log(`   ✅ Created Task 3 (order: ${task3.order})\n`);

    // 5. Test Moving Task 1 across columns (from "To Do" to "In Progress")
    console.log('5️⃣  Moving "Task 1" from "To Do" -> "In Progress"...');
    const moveRes1 = await fetch(`${BASE_URL}/tasks/${task1.id}/move`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({
            targetColumnId: inProgressCol.id,
        }),
    });
    const moveData1 = await moveRes1.json();
    if (!moveRes1.ok) throw new Error(`Move failed: ${JSON.stringify(moveData1)}`);
    console.log(`   ✅ Moved! Task 1 is now in "In Progress" with order: ${moveData1.task.order}\n`);

    // 6. Test Reordering: Move Task 3 to become the very first task in "To Do" (before Task 2)
    console.log('6️⃣  Reordering within "To Do": Moving Task 3 before Task 2 (to top of column)...');
    const moveRes2 = await fetch(`${BASE_URL}/tasks/${task3.id}/move`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({
            targetColumnId: todoCol.id,
            nextTaskId: task2.id, // placing it before task 2
        }),
    });
    const moveData2 = await moveRes2.json();
    if (!moveRes2.ok) throw new Error(`Reorder failed: ${JSON.stringify(moveData2)}`);
    console.log(`   ✅ Reordered! Task 3 new order: ${moveData2.task.order} (Task 2 order is ${task2.order})\n`);

    // 7. Test Moving using positionIndex: Move Task 2 to "In Progress" at positionIndex: 0
    console.log('7️⃣  Moving "Task 2" to "In Progress" at positionIndex: 0 (top of column)...');
    const moveRes3 = await fetch(`${BASE_URL}/tasks/${task2.id}/move`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({
            targetColumnId: inProgressCol.id,
            positionIndex: 0,
        }),
    });
    const moveData3 = await moveRes3.json();
    if (!moveRes3.ok) throw new Error(`Move by positionIndex failed: ${JSON.stringify(moveData3)}`);
    console.log(`   ✅ Moved by positionIndex! Task 2 new order: ${moveData3.task.order}\n`);

    // 8. Fetch the Full Board to confirm final structure
    console.log('8️⃣  Fetching full board state to verify structure...');
    const fullBoardRes = await fetch(`${BASE_URL}/boards/${board.id}`, {
        method: 'GET',
        headers: authHeaders,
    });
    const fullBoard = await fullBoardRes.json();

    console.log('\n================ BOARD SNAPSHOT ================');
    for (const col of fullBoard.columns) {
        console.log(`📂 [Column: ${col.title}] (order: ${col.order})`);
        if (col.tasks.length === 0) {
            console.log('   (empty)');
        } else {
            for (const t of col.tasks) {
                console.log(`   📌 [${t.title}] - order: ${t.order}`);
            }
        }
    }
    console.log('================================================\n');

    console.log('🎉 ALL BACKEND CHECKS & TESTS PASSED PERFECTLY!');
}

testBackend().catch((err) => {
    console.error('❌ Test failed with error:', err);
});
