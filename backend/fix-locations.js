const pool = require('./db'); pool.query("ALTER TABLE locations ADD CONSTRAINT locations_operator_id_unique UNIQUE (operator_id)").then(r => { console.log('done'); pool.end(); })
