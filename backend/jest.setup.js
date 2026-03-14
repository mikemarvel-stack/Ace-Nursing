// Side-effect setup run after the test framework is installed.
// Env vars that tests need but that don't require async work go here.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-min-32-chars-long-ok';
process.env.NODE_ENV = 'test';
