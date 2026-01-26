import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Generic database operations
export class Database<T extends { id: string }> {
    private filePath: string;

    constructor(fileName: string) {
        this.filePath = path.join(DATA_DIR, fileName);
        this.initialize();
    }

    private initialize() {
        if (!fs.existsSync(this.filePath)) {
            fs.writeFileSync(this.filePath, JSON.stringify([], null, 2));
        }
    }

    private readData(): T[] {
        try {
            const data = fs.readFileSync(this.filePath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            return [];
        }
    }

    private writeData(data: T[]): void {
        fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    }

    // Create
    create(item: T): T {
        const items = this.readData();
        items.push(item);
        this.writeData(items);
        return item;
    }

    // Read all
    findAll(): T[] {
        return this.readData();
    }

    // Read by ID
    findById(id: string): T | undefined {
        const items = this.readData();
        return items.find(item => item.id === id);
    }

    // Update
    update(id: string, updates: Partial<T>): T | undefined {
        const items = this.readData();
        const index = items.findIndex(item => item.id === id);

        if (index === -1) return undefined;

        items[index] = { ...items[index], ...updates };
        this.writeData(items);
        return items[index];
    }

    // Delete
    delete(id: string): boolean {
        const items = this.readData();
        const filteredItems = items.filter(item => item.id !== id);

        if (filteredItems.length === items.length) return false;

        this.writeData(filteredItems);
        return true;
    }

    // Find with custom filter
    find(predicate: (item: T) => boolean): T[] {
        const items = this.readData();
        return items.filter(predicate);
    }

    // Find one with custom filter
    findOne(predicate: (item: T) => boolean): T | undefined {
        const items = this.readData();
        return items.find(predicate);
    }
}

// Database instances
import type { AttendanceRecord, Department, Employee, LeaveRequest, User } from '@/types';

export const usersDb = new Database<User>('users.json');
export const employeesDb = new Database<Employee>('employees.json');
export const departmentsDb = new Database<Department>('departments.json');
export const leavesDb = new Database<LeaveRequest>('leaves.json');
export const attendanceDb = new Database<AttendanceRecord>('attendance.json');
