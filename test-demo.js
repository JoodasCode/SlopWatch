// Simple test file for AI accountability demo with error handling
function calculateTotal(items) {
    try {
        // Input validation
        if (!Array.isArray(items)) {
            throw new Error('Items must be an array');
        }
        
        let total = 0;
        for (let item of items) {
            if (!item || typeof item.price !== 'number') {
                throw new Error('Invalid item: missing or invalid price');
            }
            total += item.price;
        }
        return total;
    } catch (error) {
        console.error('Error calculating total:', error.message);
        throw error;
    }
}

module.exports = { calculateTotal };