// In-memory storage for notes
let notes = [];
let nextId = 1;

// Create a new note
exports.createNote = (req, res) => {
    try {
        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: 'Title and content are required'
            });
        }

        const newNote = {
            id: nextId++,
            title,
            content,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        notes.push(newNote);

        console.log(`[Notes API] Created note with ID: ${newNote.id}`);

        res.status(201).json({
            success: true,
            message: 'Note created successfully',
            data: newNote
        });
    } catch (error) {
        console.error('[Notes API] Error creating note:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating note',
            error: error.message
        });
    }
};

// Get all notes
exports.getAllNotes = (req, res) => {
    try {
        console.log(`[Notes API] Retrieved ${notes.length} notes`);

        res.status(200).json({
            success: true,
            count: notes.length,
            data: notes
        });
    } catch (error) {
        console.error('[Notes API] Error retrieving notes:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving notes',
            error: error.message
        });
    }
};

// Get a specific note by ID
exports.getNoteById = (req, res) => {
    try {
        const { id } = req.params;
        const note = notes.find(n => n.id === parseInt(id));

        if (!note) {
            console.log(`[Notes API] Note with ID ${id} not found`);
            return res.status(404).json({
                success: false,
                message: 'Note not found'
            });
        }

        console.log(`[Notes API] Retrieved note with ID: ${id}`);

        res.status(200).json({
            success: true,
            data: note
        });
    } catch (error) {
        console.error('[Notes API] Error retrieving note:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving note',
            error: error.message
        });
    }
};

// Update a note
exports.updateNote = (req, res) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;

        const noteIndex = notes.findIndex(n => n.id === parseInt(id));

        if (noteIndex === -1) {
            console.log(`[Notes API] Note with ID ${id} not found for update`);
            return res.status(404).json({
                success: false,
                message: 'Note not found'
            });
        }

        // Update only provided fields
        if (title !== undefined) notes[noteIndex].title = title;
        if (content !== undefined) notes[noteIndex].content = content;
        notes[noteIndex].updatedAt = new Date().toISOString();

        console.log(`[Notes API] Updated note with ID: ${id}`);

        res.status(200).json({
            success: true,
            message: 'Note updated successfully',
            data: notes[noteIndex]
        });
    } catch (error) {
        console.error('[Notes API] Error updating note:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating note',
            error: error.message
        });
    }
};

// Delete a note
exports.deleteNote = (req, res) => {
    try {
        const { id } = req.params;
        const noteIndex = notes.findIndex(n => n.id === parseInt(id));

        if (noteIndex === -1) {
            console.log(`[Notes API] Note with ID ${id} not found for deletion`);
            return res.status(404).json({
                success: false,
                message: 'Note not found'
            });
        }

        const deletedNote = notes.splice(noteIndex, 1)[0];

        console.log(`[Notes API] Deleted note with ID: ${id}`);

        res.status(200).json({
            success: true,
            message: 'Note deleted successfully',
            data: deletedNote
        });
    } catch (error) {
        console.error('[Notes API] Error deleting note:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting note',
            error: error.message
        });
    }
};
