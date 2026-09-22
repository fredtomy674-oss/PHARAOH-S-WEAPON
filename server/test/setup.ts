// Test bootstrap: force test mode BEFORE any module import reads env.
process.env.NODE_ENV = "test";