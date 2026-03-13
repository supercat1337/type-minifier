// @ts-check
import fs from 'node:fs/promises';

export class IOHandler {
    /**
     * 
     * @param {string} path 
     * @returns {Promise<any>}
     */
    static async loadJson(path) {
        try {
            const data = await fs.readFile(path, 'utf-8');
            return JSON.parse(data);
        } catch (e) {
            return null;
        }
    }

    /**
     * 
     * @param {string} path 
     * @param {any} data 
     */
    static async saveJson(path, data) {
        await fs.writeFile(path, JSON.stringify(data, null, 2), 'utf-8');
    }
}
