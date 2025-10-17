-- Database setup script for Event Management System
-- Run this script in MySQL to create the required databases

-- Create production database
CREATE DATABASE IF NOT EXISTS events_db;
USE events_db;

-- Create test database
CREATE DATABASE IF NOT EXISTS events_test_db;

-- Show created databases
SHOW DATABASES;

-- Note: Tables will be created automatically by TypeORM when you run the application
