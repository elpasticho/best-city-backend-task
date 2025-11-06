import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import notesRoute from './notesRoute.js';

// Create a test Express app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use('/api/v1', notesRoute);
  return app;
};

describe('Notes API Endpoints', () => {
  let app;
  let testNoteId;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('POST /api/v1/notes - Create Note', () => {
    it('should create a new note with valid data', async () => {
      const newNote = {
        title: 'Test Note',
        content: 'This is a test note content'
      };

      const response = await request(app)
        .post('/api/v1/notes')
        .send(newNote)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Note created successfully');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.title).toBe(newNote.title);
      expect(response.body.data.content).toBe(newNote.content);
      expect(response.body.data).toHaveProperty('createdAt');
      expect(response.body.data).toHaveProperty('updatedAt');

      // Save for use in other tests
      testNoteId = response.body.data.id;
    });

    it('should return 400 when title is missing', async () => {
      const invalidNote = {
        content: 'Content without title'
      };

      const response = await request(app)
        .post('/api/v1/notes')
        .send(invalidNote)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Title and content are required');
    });

    it('should return 400 when content is missing', async () => {
      const invalidNote = {
        title: 'Title without content'
      };

      const response = await request(app)
        .post('/api/v1/notes')
        .send(invalidNote)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Title and content are required');
    });

    it('should return 400 when both title and content are missing', async () => {
      const response = await request(app)
        .post('/api/v1/notes')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/notes - Get All Notes', () => {
    beforeEach(async () => {
      // Create some test notes
      await request(app)
        .post('/api/v1/notes')
        .send({ title: 'Note 1', content: 'Content 1' });

      await request(app)
        .post('/api/v1/notes')
        .send({ title: 'Note 2', content: 'Content 2' });
    });

    it('should return all notes', async () => {
      const response = await request(app)
        .get('/api/v1/notes')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('count');
      expect(response.body.count).toBeGreaterThanOrEqual(2);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should return notes with correct structure', async () => {
      const response = await request(app)
        .get('/api/v1/notes')
        .expect(200);

      const firstNote = response.body.data[0];
      expect(firstNote).toHaveProperty('id');
      expect(firstNote).toHaveProperty('title');
      expect(firstNote).toHaveProperty('content');
      expect(firstNote).toHaveProperty('createdAt');
      expect(firstNote).toHaveProperty('updatedAt');
    });
  });

  describe('GET /api/v1/notes/:id - Get Note by ID', () => {
    beforeEach(async () => {
      // Create a test note
      const response = await request(app)
        .post('/api/v1/notes')
        .send({ title: 'Specific Note', content: 'Specific Content' });
      testNoteId = response.body.data.id;
    });

    it('should return a specific note by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/notes/${testNoteId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testNoteId);
      expect(response.body.data.title).toBe('Specific Note');
      expect(response.body.data.content).toBe('Specific Content');
    });

    it('should return 404 for non-existent note ID', async () => {
      const nonExistentId = 99999;

      const response = await request(app)
        .get(`/api/v1/notes/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Note not found');
    });
  });

  describe('PUT /api/v1/notes/:id - Update Note', () => {
    beforeEach(async () => {
      // Create a test note
      const response = await request(app)
        .post('/api/v1/notes')
        .send({ title: 'Original Title', content: 'Original Content' });
      testNoteId = response.body.data.id;
    });

    it('should update a note with valid data', async () => {
      const updatedData = {
        title: 'Updated Title',
        content: 'Updated Content'
      };

      const response = await request(app)
        .put(`/api/v1/notes/${testNoteId}`)
        .send(updatedData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Note updated successfully');
      expect(response.body.data.id).toBe(testNoteId);
      expect(response.body.data.title).toBe(updatedData.title);
      expect(response.body.data.content).toBe(updatedData.content);
    });

    it('should update only title when only title is provided', async () => {
      const updatedData = {
        title: 'Only Title Updated'
      };

      const response = await request(app)
        .put(`/api/v1/notes/${testNoteId}`)
        .send(updatedData)
        .expect(200);

      expect(response.body.data.title).toBe(updatedData.title);
      expect(response.body.data.content).toBe('Original Content');
    });

    it('should update only content when only content is provided', async () => {
      const updatedData = {
        content: 'Only Content Updated'
      };

      const response = await request(app)
        .put(`/api/v1/notes/${testNoteId}`)
        .send(updatedData)
        .expect(200);

      expect(response.body.data.title).toBe('Original Title');
      expect(response.body.data.content).toBe(updatedData.content);
    });

    it('should update the updatedAt timestamp', async () => {
      // Get original note
      const originalResponse = await request(app)
        .get(`/api/v1/notes/${testNoteId}`);
      const originalUpdatedAt = originalResponse.body.data.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      // Update the note
      const response = await request(app)
        .put(`/api/v1/notes/${testNoteId}`)
        .send({ title: 'New Title' })
        .expect(200);

      expect(response.body.data.updatedAt).not.toBe(originalUpdatedAt);
    });

    it('should return 404 when updating non-existent note', async () => {
      const nonExistentId = 99999;

      const response = await request(app)
        .put(`/api/v1/notes/${nonExistentId}`)
        .send({ title: 'Updated', content: 'Updated' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Note not found');
    });
  });

  describe('DELETE /api/v1/notes/:id - Delete Note', () => {
    beforeEach(async () => {
      // Create a test note
      const response = await request(app)
        .post('/api/v1/notes')
        .send({ title: 'To Be Deleted', content: 'Delete Me' });
      testNoteId = response.body.data.id;
    });

    it('should delete a note by ID', async () => {
      const response = await request(app)
        .delete(`/api/v1/notes/${testNoteId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Note deleted successfully');
      expect(response.body.data.id).toBe(testNoteId);
    });

    it('should not find note after deletion', async () => {
      // Delete the note
      await request(app)
        .delete(`/api/v1/notes/${testNoteId}`)
        .expect(200);

      // Try to get the deleted note
      await request(app)
        .get(`/api/v1/notes/${testNoteId}`)
        .expect(404);
    });

    it('should return 404 when deleting non-existent note', async () => {
      const nonExistentId = 99999;

      const response = await request(app)
        .delete(`/api/v1/notes/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Note not found');
    });
  });

  describe('Integration - Full CRUD Flow', () => {
    it('should complete a full CRUD cycle', async () => {
      // 1. CREATE
      const createResponse = await request(app)
        .post('/api/v1/notes')
        .send({ title: 'CRUD Test', content: 'Testing full cycle' })
        .expect(201);

      const noteId = createResponse.body.data.id;
      expect(createResponse.body.success).toBe(true);

      // 2. READ (Get All)
      const getAllResponse = await request(app)
        .get('/api/v1/notes')
        .expect(200);

      expect(getAllResponse.body.data.some(note => note.id === noteId)).toBe(true);

      // 3. READ (Get By ID)
      const getByIdResponse = await request(app)
        .get(`/api/v1/notes/${noteId}`)
        .expect(200);

      expect(getByIdResponse.body.data.title).toBe('CRUD Test');

      // 4. UPDATE
      const updateResponse = await request(app)
        .put(`/api/v1/notes/${noteId}`)
        .send({ title: 'Updated CRUD Test', content: 'Updated content' })
        .expect(200);

      expect(updateResponse.body.data.title).toBe('Updated CRUD Test');

      // 5. DELETE
      const deleteResponse = await request(app)
        .delete(`/api/v1/notes/${noteId}`)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);

      // 6. VERIFY DELETION
      await request(app)
        .get(`/api/v1/notes/${noteId}`)
        .expect(404);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string title', async () => {
      const response = await request(app)
        .post('/api/v1/notes')
        .send({ title: '', content: 'Content' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle empty string content', async () => {
      const response = await request(app)
        .post('/api/v1/notes')
        .send({ title: 'Title', content: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle very long title', async () => {
      const longTitle = 'A'.repeat(1000);

      const response = await request(app)
        .post('/api/v1/notes')
        .send({ title: longTitle, content: 'Content' })
        .expect(201);

      expect(response.body.data.title).toBe(longTitle);
    });

    it('should handle very long content', async () => {
      const longContent = 'B'.repeat(10000);

      const response = await request(app)
        .post('/api/v1/notes')
        .send({ title: 'Title', content: longContent })
        .expect(201);

      expect(response.body.data.content).toBe(longContent);
    });

    it('should handle special characters in title and content', async () => {
      const specialNote = {
        title: 'Test @#$%^&*() Title',
        content: 'Content with <html> & "quotes" and \'apostrophes\''
      };

      const response = await request(app)
        .post('/api/v1/notes')
        .send(specialNote)
        .expect(201);

      expect(response.body.data.title).toBe(specialNote.title);
      expect(response.body.data.content).toBe(specialNote.content);
    });
  });

  describe('Response Structure', () => {
    it('should have consistent success response structure', async () => {
      const response = await request(app)
        .post('/api/v1/notes')
        .send({ title: 'Test', content: 'Test' })
        .expect(201);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(typeof response.body.success).toBe('boolean');
      expect(typeof response.body.message).toBe('string');
      expect(typeof response.body.data).toBe('object');
    });

    it('should have consistent error response structure', async () => {
      const response = await request(app)
        .post('/api/v1/notes')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body.success).toBe(false);
      expect(typeof response.body.message).toBe('string');
    });
  });
});
