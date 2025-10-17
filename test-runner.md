# E2E Testing Guide

## **How to Run Tests**

### **1. Run All E2E Tests**
```bash
npm run test:e2e
```

### **2. Run Tests with Coverage**
```bash
npm run test:cov
```

### **3. Run Tests in Watch Mode**
```bash
npm run test:e2e -- --watch
```

### **4. Run Specific Test Suite**
```bash
npm run test:e2e -- --testNamePattern="Users API"
npm run test:e2e -- --testNamePattern="Events API"
npm run test:e2e -- --testNamePattern="MergeAll API"
```

---

## **Test Coverage**

The E2E tests cover:

### **Users API Tests:**
- ✅ Create user
- ✅ Get user by ID
- ✅ Get all users
- ✅ Get user events
- ✅ Handle non-existent users

### **Events API Tests:**
- ✅ Create event with invitees
- ✅ Create event without invitees
- ✅ Get event by ID
- ✅ Delete event
- ✅ Handle non-existent events

### **MergeAll API Tests:**
- ✅ Merge overlapping events
- ✅ Handle user with no events
- ✅ Handle single event (no merge needed)
- ✅ Handle non-existent users

### **Validation Tests:**
- ✅ Required field validation
- ✅ Enum value validation
- ✅ Date format validation
- ✅ Numeric ID validation

### **Edge Cases:**
- ✅ Events with same start/end time
- ✅ Events with multiple invitees
- ✅ Error handling scenarios

---

## 🔧 **Test Configuration**

### **Database:**
- Uses SQLite in-memory database
- Automatically creates tables
- Cleans up after each test run

### **Timeout:**
- Set to 30 seconds for complex operations
- Sufficient for merge operations

### **Validation:**
- Global validation pipe enabled
- Tests both valid and invalid inputs

---

## 📊 **Expected Results**

When all tests pass, you should see:
```
✅ All E2E tests passing
✅ High test coverage
✅ Fast execution (under 30 seconds)
✅ Clean test isolation
```

---

## 🐛 **Troubleshooting**

### **Common Issues:**

1. **Database Connection Errors:**
   - Ensure SQLite3 is installed
   - Check test database configuration

2. **Timeout Errors:**
   - Increase timeout in jest-e2e.json
   - Check for infinite loops in merge logic

3. **Import Errors:**
   - Verify all dependencies are installed
   - Check TypeScript configuration

### **Debug Mode:**
```bash
npm run test:e2e -- --verbose
```

---

## 🚀 **Next Steps**

After E2E tests pass:
1. ✅ Run unit tests: `npm test`
2. ✅ Check test coverage: `npm run test:cov`
3. ✅ Prepare demo video
4. ✅ Update README.md
5. ✅ Create pull request

---

**Happy Testing! 🎉**
