import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper }
  from '@material-ui/core'
import { useDB } from 'react-pouchdb'

const useStyles = makeStyles({
  table: {
    minWidth: 650,
  },
});

function createData(name, calories, fat, carbs, protein) {
  return { name, calories, fat, carbs, protein };
}

export default () => {
  const classes = useStyles()
  const db = useDB()
  const [rows, setRows] = useState([])

  useEffect(() => {
    db.allDocs({ limit: 30, include_docs: true })
    .then(res => res.rows)
    .then(res => { console.debug(res); return res })
    .then(setRows)
  }, [db])

  return (
    <TableContainer component={Paper}>
      <Table className={classes.table} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>UUID</TableCell>
            <TableCell align="right">Author</TableCell>
            <TableCell align="right">Title</TableCell>
            <TableCell align="right">Award</TableCell>
            <TableCell align="right">Series</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(row => row.doc).map((row) => (
            <TableRow key={row.uuid}>
              <TableCell component="th" scope="row">
                {row.uuid}
              </TableCell>
              <TableCell align="right">{row.creators && row.creators.name}</TableCell>
              <TableCell align="right">{row.title}</TableCell>
              <TableCell align="right">{row.award && row.award.year}</TableCell>
              <TableCell align="right">{row.series && row.series.title}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
