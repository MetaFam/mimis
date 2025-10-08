// Not supported in the community edition
//
// CREATE USER readonly IF NOT EXISTS SET PASSWORD 'readonly' CHANGE NOT REQUIRED;
// CREATE ROLE reader IF NOT EXISTS;
// GRANT TRAVERSE ON GRAPH * TO reader;
// GRANT READ { * } ON GRAPH * TO reader;
// GRANT MATCH { * } ON GRAPH * TO reader;
// GRANT ROLE reader TO readonly;
